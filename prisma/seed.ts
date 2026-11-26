import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SEED = 42;
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['RBC', 'Plasma', 'Platelets'];
const RULES: Record<string, any> = {
  RBC: { storageMin: 2, storageMax: 6, shelfLifeDays: 42, transportMin: 2, transportMax: 10, source: 'e-RaktKosh public guidance (verified 2026-11-26)', version: 'v1' },
  Plasma: { storageMin: -30, storageMax: -18, shelfLifeDays: 365, transportMin: -30, transportMax: -18, source: 'e-RaktKosh public guidance (verified 2026-11-26)', version: 'v1' },
  Platelets: { storageMin: 20, storageMax: 24, shelfLifeDays: 5, transportMin: 20, transportMax: 24, source: 'e-RaktKosh public guidance (verified 2026-11-26)', version: 'v1' },
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rng = mulberry32(SEED);
const DAY = 86400000, WEEK = 7 * DAY;
const DAY_STAMP = new Date('2026-11-23T00:00:00Z').getTime();

async function batches<T>(rows: T[], fn: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += 1000) await fn(rows.slice(i, i + 1000));
}

async function main() {
  console.log(`Seeding HemoNexus, seed=${SEED}`);
  for (const m of ['auditLog','reservation','approval','transferRequest','excursionEvent','temperatureReading','alert','riskScore','forecastSnapshot','dataTrustRecord','bloodUnit','consumptionEvent','donationEvent','componentRule','user','institution']) {
    await (prisma as any)[m].deleteMany({});
  }
  await prisma.componentRule.createMany({ data: Object.entries(RULES).map(([component, r]) => ({ component, ...r })) });

  const defs = [
    ['Northbridge District Hospital','HOSPITAL','North',28.61,77.21],['Pinecrest Medical Centre','HOSPITAL','North',28.63,77.18],
    ['Ridgeline General Hospital','HOSPITAL','North',28.58,77.26],['Valleyview Community Hospital','HOSPITAL','East',26.91,75.79],
    ['Eastgate Trauma Centre','HOSPITAL','East',26.94,75.82],['Lakeside District Hospital','HOSPITAL','East',26.88,75.74],
    ['Harbourstone Medical College','HOSPITAL','South',19.07,72.88],['Southpoint Clinical Centre','HOSPITAL','South',19.11,72.85],
    ['Central Regional Blood Bank','BLOOD_BANK','North',28.60,77.23],['Eastern Blood Storage Centre','BLOOD_BANK','East',26.92,75.80],
  ] as const;
  const institutions: any[] = [];
  for (const [name, type, region, lat, lng] of defs) {
    institutions.push(await prisma.institution.create({ data: { name: `${name} (SIMULATED)`, type, region, lat, lng, verified: true, isSimulated: true } }));
  }

  const consumption: any[] = [], donations: any[] = [], units: any[] = [], trusts: any[] = [];
  const excursions: { key: number; startedAt: Date; reason: string }[] = [];
  for (const inst of institutions) {
    for (const group of GROUPS) for (const component of COMPONENTS) {
      const base = component === 'Platelets' ? 2 : component === 'Plasma' ? 4 : 8;
      const gf = group.includes('-') ? 0.55 : 1;
      for (let w = 0; w < 104; w++) {
        const d = new Date(DAY_STAMP - (103 - w) * WEEK);
        const season = 1 + 0.18 * Math.sin((w / 52) * 2 * Math.PI);
        let v = Math.max(0, Math.round(base * gf * season * (0.8 + rng() * 0.4)));
        if (group === 'O-' && component === 'RBC' && inst.region === 'East' && w >= 82 && w <= 87) v = Math.round(v * (1 + (w - 81) * 0.12));
        if ((group === 'O-' && component === 'RBC' && inst.region === 'East' && w >= 88 && w <= 94) || (group === 'AB-' && component === 'Plasma' && inst.region === 'North' && w >= 96 && w <= 99)) v = Math.round(v * 1.85);
        if (v > 0) consumption.push({ institutionId: inst.id, group, component, units: v, occurredAt: d, source: 'SIMULATED' });
      }
      for (let w = 0; w < 104; w += 2) {
        const d = new Date(DAY_STAMP - (103 - w) * WEEK);
        donations.push({ institutionId: inst.id, group, units: Math.max(0, Math.round(base * gf * (0.7 + rng() * 0.8))), arrivedAt: d, availableAt: new Date(d.getTime() + 2 * DAY) });
      }
      const shortage = group === 'O-' && component === 'RBC' && inst.region === 'East';
      const count = Math.max(1, Math.round(base * gf * (shortage ? 0.7 : 1.5)));
      for (let u = 0; u < count; u++) {
        const ex = inst.region === 'East' && group === 'O-' && component === 'RBC' && u === 0;
        const q = inst.region === 'North' && group === 'AB-' && component === 'Platelets' && u === 0;
        const collected = new Date(DAY_STAMP - Math.floor(rng() * RULES[component].shelfLifeDays * 0.7) * DAY);
        const key = units.length;
        units.push({
          institutionId: inst.id, group, component, collectedAt: collected,
          expiresAt: new Date(collected.getTime() + RULES[component].shelfLifeDays * DAY),
          storageCondition: `${RULES[component].storageMin}-${RULES[component].storageMax}C`,
          quarantineState: q ? 'QUARANTINED' : 'IN_STOCK', qualityVerified: !ex && !q, excursionOpen: ex,
          temperatureC: ex ? 12 : (RULES[component].storageMin + RULES[component].storageMax) / 2,
          lastUpdateAt: new Date(DAY_STAMP - (inst.region === 'South' ? 4 * DAY : rng() * 12 * 3600000)),
        });
        if (ex) excursions.push({ key, startedAt: new Date(DAY_STAMP - 6 * 3600000), reason: 'SIMULATED transport delay' });
      }
    }
    const stale = inst.region === 'South', incomplete = inst.name.includes('Lakeside');
    trusts.push({ institutionId: inst.id, lastUpdateAt: new Date(DAY_STAMP - (stale ? 4 * DAY : 3600000)), verificationState: 'VERIFIED', missingFields: incomplete ? JSON.stringify(['storageCondition']) : '[]', conflicts: '[]', staleFlag: stale, completenessPct: incomplete ? 80 : 100 });
  }
  await batches(consumption, (c) => prisma.consumptionEvent.createMany({ data: c }));
  await batches(donations, (c) => prisma.donationEvent.createMany({ data: c }));
  await batches(units, (c) => prisma.bloodUnit.createMany({ data: c }));
  await prisma.dataTrustRecord.createMany({ data: trusts });
  const savedUnits = await prisma.bloodUnit.findMany({ select: { id: true }, orderBy: { id: 'asc' } });
  // excursion fixtures reference the first matching unit by deterministic key order; re-query by attributes
  const exUnit = await prisma.bloodUnit.findFirst({ where: { excursionOpen: true } });
  if (exUnit) await prisma.excursionEvent.create({ data: { unitId: exUnit.id, startedAt: excursions[0]?.startedAt ?? new Date(DAY_STAMP - 6 * 3600000), reason: 'SIMULATED transport delay' } });

  const hash = await bcrypt.hash('HemoNexus!2026', 10);
  await prisma.user.createMany({ data: [
    ['coordinator@simulated.local','REGIONAL_COORDINATOR',null,'Regional Coordinator'],
    ['hospital@simulated.local','HOSPITAL_MANAGER',institutions[0].id,'Hospital Manager'],
    ['bank@simulated.local','BLOOD_BANK_MANAGER',institutions[8].id,'Bank Manager'],
    ['clinical@simulated.local','CLINICAL_REVIEWER',null,'Clinical Reviewer (SIMULATED)'],
    ['analyst@simulated.local','ANALYST',null,'Analyst'],
    ['admin@simulated.local','PLATFORM_ADMIN',null,'Platform Admin'],
  ].map(([email, role, institutionId, name]) => ({ email: email as string, passwordHash: hash, role: role as string, institutionId: institutionId as any, name: name as string })) });

  console.log('Seed complete:', JSON.stringify({
    institutions: await prisma.institution.count(), units: await prisma.bloodUnit.count(),
    consumption: await prisma.consumptionEvent.count(), donations: await prisma.donationEvent.count(),
    users: await prisma.user.count(),
  }));
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
