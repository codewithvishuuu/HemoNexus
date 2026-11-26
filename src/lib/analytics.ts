// Deterministic forecasting and explainable risk scoring. No LLM generates numbers here.

export type Series = number[];
export type Forecast = { point: number[]; low: number[]; high: number[]; modelVersion: string; state: string };

export const MODEL_VERSION = 'hw-additive-v1';
export const WEIGHTS_VERSION = 'weights-v1';
export const WEIGHTS = { cover: 0.40, demand: 0.20, supply: 0.15, expiry: 0.10, network: 0.15 };
export const MIN_OBS = 104;
export const MIN_OBS_FALLBACK = 52;

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

/** Seasonal naive: same week in previous seasonal cycle (52 weeks), else last value. */
export function seasonalNaive(s: Series, horizon: number): number[] {
  return Array.from({ length: horizon }, (_, i) => s[s.length - 52 + i] ?? s[s.length - 1] ?? 0);
}

/** Trailing moving average. */
export function movingAverage(s: Series, horizon: number, window = 4): number[] {
  const last = mean(s.slice(-window));
  return Array.from({ length: horizon }, () => last);
}

/** Compact additive Holt-Winters (level, trend, weekly seasonality). */
export function holtWinters(s: Series, horizon: number, period = 52, alpha = 0.35, beta = 0.02, gamma = 0.25): number[] {
  if (s.length < period * 2) return seasonalNaive(s, horizon);
  const n = s.length;
  const initialLevel = mean(s.slice(0, period));
  const seasonal: number[] = [];
  for (let i = 0; i < period; i++) {
    const vals = [];
    for (let j = i; j < n; j += period) vals.push(s[j]);
    seasonal.push(mean(vals) - initialLevel);
  }
  let level = initialLevel;
  let trend = (mean(s.slice(period, period * 2)) - initialLevel) / period;
  for (let t = 0; t < n; t++) {
    const prevLevel = level;
    const si = t % period;
    level = alpha * (s[t] - seasonal[si]) + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonal[si] = gamma * (s[t] - level) + (1 - gamma) * seasonal[si];
  }
  return Array.from({ length: horizon }, (_, h) => Math.max(0, level + (h + 1) * trend + seasonal[(n + h) % period]));
}

/** Typed insufficient-data handling. Every scenario returns a state, never a fabricated number. */
export function forecastState(s: Series, method: 'ets' | 'naive' | 'moving' = 'ets'):
  { state: string; reason?: string; required?: number; available: number; method: string } {
  const available = s.length;
  if (available < MIN_OBS_FALLBACK) return { state: 'INSUFFICIENT_DATA', reason: 'HISTORY_CRITICAL', required: MIN_OBS_FALLBACK, available, method };
  if (method === 'ets' && available < MIN_OBS) return { state: 'INSUFFICIENT_DATA', reason: 'HISTORY_SHORT', required: MIN_OBS, available, method: 'moving' };
  if (s.every((v) => v === 0)) return { state: 'NO_SIGNAL', reason: 'ALL_ZERO_DEMAND', available, method };
  if (s.some((v) => v === 0)) return { state: 'LOW_VOLUME', available, method };
  return { state: 'OK', available, method };
}

export function forecast(s: Series, horizon = 4, method: 'ets' | 'naive' | 'moving' = 'ets'): Forecast {
  const st = forecastState(s, method);
  if (st.state === 'INSUFFICIENT_DATA' && st.reason === 'HISTORY_CRITICAL') {
    return { point: [], low: [], high: [], modelVersion: MODEL_VERSION, state: 'INSUFFICIENT_DATA' };
  }
  const useMethod = st.method === 'moving' ? 'moving' : method;
  const point = useMethod === 'naive' ? seasonalNaive(s, horizon) : useMethod === 'moving' ? movingAverage(s, horizon) : holtWinters(s, horizon);
  const residualScale = Math.max(0.5, Math.sqrt(mean(s.slice(-13).map((v, i, a) => (v - (a[i - 1] ?? v)) ** 2))) * 1.4);
  return {
    point,
    low: point.map((v) => Math.max(0, v - 1.28 * residualScale)),
    high: point.map((v) => v + 1.28 * residualScale),
    modelVersion: useMethod === 'ets' ? MODEL_VERSION : `${useMethod}-v1`,
    state: st.state,
  };
}

export type Metrics = { mae: number; wape: number; mase: number; bias: number; coverage: number; precision: number; recall: number; leadTimeDays: number; falseAlarms: number; missedEvents: number; folds: number };

/** Rolling-origin backtest, 4 folds, 8+ weeks train / 4 weeks test. */
export function backtest(s: Series, events: { index: number; duration?: number }[] = []): { metrics: Metrics; baseline: Metrics; folds: number } {
  const testSize = 4;
  const folds = Math.min(4, Math.max(0, Math.floor((s.length - MIN_OBS_FALLBACK) / testSize)));
  if (folds < 4) return { metrics: emptyMetrics(), baseline: emptyMetrics(), folds };
  const errs: number[] = [], naiveErrs: number[] = [], signedErrs: number[] = [], actuals: number[] = [], covers: number[] = [];
  for (let f = 0; f < folds; f++) {
    const cut = s.length - (folds - f) * testSize;
    const train = s.slice(0, cut);
    const actual = s.slice(cut, cut + testSize);
    if (!actual.length) continue;
    const pred = forecast(train, actual.length, 'ets').point;
    const naive = seasonalNaive(train, actual.length);
    const scale = Math.max(0.5, Math.sqrt(mean(train.slice(-13).map((v, i, a) => (v - (a[i - 1] ?? v)) ** 2))) * 1.4);
    actual.forEach((a, i) => {
      errs.push(Math.abs(a - pred[i]));
      signedErrs.push(pred[i] - a);
      naiveErrs.push(Math.abs(a - naive[i]));
      actuals.push(a);
      covers.push(Math.abs(a - pred[i]) <= 1.28 * scale ? 1 : 0);
    });
  }
  const naiveScale = mean(naiveErrs) || 1;
  const metrics: Metrics = {
    mae: mean(errs),
    wape: mean(errs) / (mean(actuals) || 1),
    mase: mean(errs) / naiveScale,
    bias: mean(signedErrs),
    coverage: mean(covers),
    precision: 0.8, recall: 0.8, leadTimeDays: 0, falseAlarms: 0, missedEvents: 0, folds,
  };
  // Event-level metrics: rolling one-week forecasts vs a trailing 12-week baseline.
  // A flag counts as a true positive if it falls in [onset-5, end] of a seeded event.
  const flags: number[] = [];
  for (let t = MIN_OBS_FALLBACK; t < s.length; t++) {
    const recent = mean(s.slice(t - 2, t));
    const trailing = mean(s.slice(t - 12, t));
    if (trailing > 0 && recent > trailing * 1.14) flags.push(t);
  }
  const windows = events.map((e) => ({ start: e.index, end: e.index + (e.duration ?? 6) }));
  const hits = windows.filter((w) => flags.some((f) => f >= w.start - 5 && f <= w.end));
  const truePositives = flags.filter((f) => windows.some((w) => f >= w.start - 5 && f <= w.end)).length;
  metrics.precision = flags.length ? truePositives / flags.length : 0;
  metrics.recall = windows.length ? hits.length / windows.length : 0;
  metrics.falseAlarms = flags.length - truePositives;
  metrics.missedEvents = windows.length - hits.length;
  metrics.leadTimeDays = windows.length
    ? Math.max(0, ...windows.map((w) => {
        const first = flags.filter((f) => f >= w.start - 5 && f <= w.start)[0];
        return first === undefined ? 0 : (w.start - first) * 7;
      }))
    : 0;
  const baselineMetrics = { ...metrics, mae: mean(naiveErrs), wape: mean(naiveErrs) / (mean(actuals) || 1), mase: 1, bias: 0 };
  return { metrics, baseline: baselineMetrics, folds };
}

function emptyMetrics(): Metrics { return { mae: 0, wape: 0, mase: 0, bias: 0, coverage: 0, precision: 0, recall: 0, leadTimeDays: 0, falseAlarms: 0, missedEvents: 0, folds: 0 }; }

export type FactorSet = { cover_risk: number; demand_pressure: number; supply_gap: number; expiry_pressure: number; network_scarcity: number };

export function scoreRisk(input: {
  usableStock: number; forecastWeeklyDemand: number; trailingDemand: number; inbound: number;
  expiring14d: number; nearbySurplus: number | null; policyDays?: number;
}): { band: string; raw: number; factors: FactorSet; state: string; forced?: string } {
  const policyDays = input.policyDays ?? 5;
  const daily = Math.max(0.01, input.forecastWeeklyDemand / 7);
  const daysOfCover = input.usableStock / daily;
  const factors: FactorSet = {
    cover_risk: clamp((policyDays - daysOfCover) / policyDays),
    demand_pressure: clamp((input.forecastWeeklyDemand - input.trailingDemand) / Math.max(1, input.trailingDemand)),
    supply_gap: clamp(1 - input.inbound / Math.max(1, input.forecastWeeklyDemand)),
    expiry_pressure: clamp(input.expiring14d / Math.max(1, input.usableStock)),
    network_scarcity: input.nearbySurplus === null ? 0 : clamp(1 - input.nearbySurplus / Math.max(1, input.forecastWeeklyDemand)),
  };
  const w = { ...WEIGHTS };
  if (input.nearbySurplus === null) {
    const total = w.cover + w.demand + w.supply + w.expiry;
    w.cover /= total; w.demand /= total; w.supply /= total; w.expiry /= total;
    w.network = 0;
  }
  const raw = clamp(w.cover * factors.cover_risk + w.demand * factors.demand_pressure + w.supply * factors.supply_gap + w.expiry * factors.expiry_pressure + w.network * factors.network_scarcity);
  let band = raw >= 0.70 ? 'CRITICAL' : raw >= 0.50 ? 'HIGH' : raw >= 0.30 ? 'MODERATE' : 'STABLE';
  let forced: string | undefined;
  if (daysOfCover < 1) { band = 'CRITICAL'; forced = 'days_of_cover < 1'; }
  return { band, raw: Number(raw.toFixed(4)), factors, state: 'OK', forced };
}
