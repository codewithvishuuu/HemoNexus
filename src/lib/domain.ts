import { prisma, DATA_MODE } from './db';
import { forecast, backtest, scoreRisk, MODEL_VERSION, WEIGHTS_VERSION } from './analytics';

export const COMPATIBILITY: Record<string, string[]> = {
  'O-': ['O-'], 'A-': ['A-', 'O-'], 'B-': ['B-', 'O-'], 'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'], 'A+': ['A+', 'A-', 'O+', 'O-'], 'B+': ['B+', 'B-', 'O+', 'O-'], 'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
};

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, rad = (d: number) => d * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function freshness(record: any, now = new Date()) {
  const ageHours = (now.getTime() - new Date(record.lastUpdateAt).getTime()) / 3600000;
  const band = ageHours <= 24 ? 'UPDATED' : ageHours <= 48 ? 'AGING' : 'STALE';
  return { ageHours: Number(ageHours.toFixed(1)), band, stale: band === 'STALE' || record.staleFlag };
}

export function eligible(unit: any) {
  return unit.qualityVerified && unit.quarantineState === 'IN_STOCK' && !unit.excursionOpen && !unit.reserved && new Date(unit.expiresAt) > new Date();
}

export async function audit(actor: string, action: string, entity: string, summary: any, institutionId?: string | null) {
  return prisma.auditLog.create({ data: { actor, action, entity, summary: JSON.stringify(summary), institutionId: institutionId ?? null, traceId: `${Date.now()}` } });
}

export async function getSeries(region: string, group: string, component: string): Promise<number[]> {
  const insts = await prisma.institution.findMany({ where: { region }, select: { id: true } });
  const rows = await prisma.consumptionEvent.findMany({
    where: { institutionId: { in: insts.map((i) => i.id) }, group, component },
    orderBy: { occurredAt: 'asc' }, select: { occurredAt: true, units: true },
  });
  const buckets = new Map<string, number>();
  for (const r of rows) {
    const key = r.occurredAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + r.units);
  }
  return [...buckets.values()];
}

export async function networkScores() {
  const scores = await prisma.riskScore.findMany({ orderBy: { asOf: 'desc' }, take: 200 });
  return scores;
}

/** Computes and persists an explainable risk score for one institution/group/component. */
export async function computeScore(institutionId: string, group: string, component: string) {
  const inst = await prisma.institution.findUniqueOrThrow({ where: { id: institutionId } });
  const trust = await prisma.dataTrustRecord.findFirst({ where: { institutionId } });
  if (trust && (trust.staleFlag || trust.verificationState === 'REJECTED' || trust.conflicts !== '[]')) {
    return { state: 'DATA_QUALITY_BLOCK', band: null, reason: 'Source failed Data Trust gate' };
  }
  const series = await getSeries(inst.region, group, component);
  const bt = backtest(series, eventsFor(inst.region, group, component));
  const method = bt.folds === 4 && bt.baseline.wape < bt.metrics.wape ? 'naive' : 'ets';
  const st = forecast(series, 4, method as any);
  if (st.state === 'INSUFFICIENT_DATA' || st.state === 'NO_SIGNAL') return { state: st.state, band: null, reason: st.state };

  const units = await prisma.bloodUnit.findMany({ where: { institutionId, group, component } });
  const eligibleUnits = units.filter(eligible);
  const usableStock = eligibleUnits.length;
  const forecastDemand = st.point[0] ?? 0;
  const trailing = series.slice(-4).reduce((a, b) => a + b, 0) / 4;
  const inbound = await prisma.donationEvent.aggregate({
    where: { institutionId, group, availableAt: { gte: new Date() } }, _sum: { units: true },
  });
  const now = new Date();
  const expiring14 = eligibleUnits.filter((u: any) => (new Date(u.expiresAt).getTime() - now.getTime()) / 86400000 <= 14).length;
  const others = await prisma.institution.findMany({ where: { id: { not: institutionId } } });
  const nearbySurplus = others.reduce((best, o) => {
    const d = haversine(inst, o);
    return d <= 150 ? best + 1 : best;
  }, 0);

  const scored = scoreRisk({
    usableStock, forecastWeeklyDemand: forecastDemand, trailingDemand: trailing,
    inbound: inbound._sum.units ?? 0, expiring14d: expiring14,
    nearbySurplus: nearbySurplus === 0 ? null : nearbySurplus,
  });
  const saved = await prisma.riskScore.create({
    data: { institutionId, group, component, band: scored.band, raw: scored.raw, factors: JSON.stringify(scored.factors), weightsVersion: WEIGHTS_VERSION, state: scored.state },
  });
  return { ...scored, id: saved.id, asOf: saved.asOf, eligibleUnits: usableStock, forecastDemand, dataMode: DATA_MODE };
}

function eventsFor(region: string, group: string, component: string): { index: number; duration: number }[] {
  if (region === 'East' && group === 'O-' && component === 'RBC') return [{ index: 88, duration: 6 }];
  if (region === 'North' && group === 'AB-' && component === 'Plasma') return [{ index: 96, duration: 3 }];
  return [];
}

export async function runBacktest(region = 'East', group = 'O-', component = 'RBC') {
  const series = await getSeries(region, group, component);
  const events = eventsFor(region, group, component);
  const bt = backtest(series, events);
  const selectedModel = bt.folds === 4 && bt.baseline.wape < bt.metrics.wape ? 'seasonal-naive (baseline retained)' : MODEL_VERSION;
  return { ...bt, seriesLength: series.length, modelVersion: MODEL_VERSION, selectedModel, events, dataMode: DATA_MODE, folds: bt.folds };
}

export async function matchingCandidates(params: { fromId: string; group: string; component: string; radiusKm: number }) {
  const from = await prisma.institution.findUniqueOrThrow({ where: { id: params.fromId } });
  const allowed = COMPATIBILITY[params.group] ?? [];
  const institutions = await prisma.institution.findMany({ where: { id: { not: params.fromId } } });
  const candidates: any[] = [];
  for (const inst of institutions) {
    const distanceKm = haversine(from, inst);
    if (distanceKm > params.radiusKm) continue;
    const units = await prisma.bloodUnit.findMany({ where: { institutionId: inst.id, group: { in: allowed }, component: params.component } });
    const good = units.filter(eligible);
    const blockers: string[] = [];
    if (!good.length) blockers.push('NO_VERIFIED_UNIT');
    if (!inst.verified) blockers.push('INSTITUTION_NOT_VERIFIED');
    const transportHours = distanceKm / 45;
    const rule = await prisma.componentRule.findUnique({ where: { component: params.component } });
    if (rule && transportHours > (rule.shelfLifeDays > 30 ? 8 : 4)) blockers.push('COLD_CHAIN_WINDOW');
    candidates.push({
      institutionId: inst.id, institutionName: inst.name, distanceKm: Number(distanceKm.toFixed(1)),
      transportHours: Number(transportHours.toFixed(1)), availableUnits: good.length,
      blockers, actionable: blockers.length === 0 && good.length > 0,
      reason: blockers.length ? blockers.join(', ') : 'Verified, compatible, in-date and within cold-chain window',
    });
  }
  return candidates.sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Simulation runs on cloned in-memory state; it cannot write inventory tables. */
export async function runSimulation(input: { scenario: string; surgePct?: number; fromInstitutionId?: string; group?: string; component?: string; days?: number }) {
  const days = input.days ?? 7;
  const group = input.group ?? 'O-';
  const component = input.component ?? 'RBC';
  const snapshot = await prisma.bloodUnit.findMany({ where: { group, component } });
  const cloned = snapshot.map((u) => ({ ...u, collectedAt: new Date(u.collectedAt), expiresAt: new Date(u.expiresAt) }));
  const scenario = input.scenario;
  let surgePct = input.surgePct ?? 30;
  let operation = 'demand surge applied to cloned snapshot';
  const region = 'East';
  const series = await getSeries(region, group, component);
  const base = forecast(series, Math.min(4, days), 'ets').point[0] ?? 0;
  const baselineStock = cloned.filter(eligible).length;

  if (scenario === 'REGIONAL_SHORTAGE') { surgePct = Math.max(surgePct, 50); operation = 'regional surge (minimum +50%)'; }
  if (scenario === 'INVENTORY_LOSS') { operation = '30% of eligible units removed from cloned snapshot'; }
  if (scenario === 'ADDED_DONATIONS') { operation = 'inbound donations add 50% of one week of forecast demand'; }
  const simulatedDemand = base * (1 + surgePct / 100);
  let projected = Math.max(0, baselineStock - Math.round(simulatedDemand - base));
  if (scenario === 'INVENTORY_LOSS') projected = Math.round(baselineStock * 0.7);
  if (scenario === 'ADDED_DONATIONS') projected = baselineStock + Math.round(base * 0.5);

  const assumptions = [`scenario=${scenario}`, `surgePct=${surgePct}`, `operation=${operation}`, `group=${group}`, `component=${component}`, `days=${days}`, 'cloned snapshot at run time'];
  const result = { baselineAvailable: baselineStock, projectedAvailable: projected, baselineDemand: base, simulatedDemand, deltaUnits: projected - baselineStock };
  const run = await prisma.simulationRun.create({
    data: { actor: 'SIMULATED_USER', scenario: input.scenario, assumptions: JSON.stringify(assumptions), result: JSON.stringify(result) },
  });
  return { runId: run.id, mode: 'SIMULATION', assumptions, result, dataMode: DATA_MODE };
}
