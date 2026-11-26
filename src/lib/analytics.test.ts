import { describe, it, expect } from 'vitest';
import { forecast, forecastState, seasonalNaive, movingAverage, backtest, scoreRisk } from './analytics';

const series = Array.from({ length: 120 }, (_, i) => 10 + Math.round(3 * Math.sin(i / 8)));

describe('forecast states', () => {
  it('returns critical insufficient data below 52 weeks', () => {
    expect(forecastState(Array(51).fill(1))).toMatchObject({ state: 'INSUFFICIENT_DATA', reason: 'HISTORY_CRITICAL' });
    expect(forecast(Array(51).fill(1)).point).toEqual([]);
  });
  it('falls back to moving average between 52 and 104 weeks', () => {
    expect(forecastState(Array(70).fill(2))).toMatchObject({ reason: 'HISTORY_SHORT', method: 'moving' });
    expect(forecast(Array(70).fill(2)).modelVersion).toBe('moving-v1');
  });
  it('detects all-zero and intermittent series', () => {
    expect(forecastState(Array(110).fill(0)).state).toBe('NO_SIGNAL');
    expect(forecastState([...Array(109).fill(1), 0]).state).toBe('LOW_VOLUME');
  });
});

describe('deterministic forecasting', () => {
  it('seasonal naive and moving average are deterministic and non-negative', () => {
    expect(seasonalNaive(series, 4)).toEqual(seasonalNaive(series, 4));
    expect(movingAverage(series, 4).every((v) => v >= 0)).toBe(true);
    expect(forecast(series).point.every((v) => v >= 0)).toBe(true);
  });
  it('is reproducible', () => expect(forecast(series, 4)).toEqual(forecast(series, 4)));
  it('backtest has 4 folds and bounded metrics', () => {
    const bt = backtest(series);
    expect(bt.folds).toBe(4);
    expect(bt.metrics.mae).toBeGreaterThanOrEqual(0);
    expect(bt.baseline.mae).toBeGreaterThanOrEqual(0);
  });
});

describe('risk scoring', () => {
  it('forces CRITICAL when days of cover below one', () => {
    const r = scoreRisk({ usableStock: 1, forecastWeeklyDemand: 70, trailingDemand: 10, inbound: 0, expiring14d: 0, nearbySurplus: 0 });
    expect(r.band).toBe('CRITICAL');
    expect(r.forced).toBe('days_of_cover < 1');
  });
  it('stable for ample verified stock', () => {
    const r = scoreRisk({ usableStock: 200, forecastWeeklyDemand: 10, trailingDemand: 10, inbound: 20, expiring14d: 1, nearbySurplus: 100 });
    expect(r.band).toBe('STABLE');
  });
  it('renormalises weights without network data and never mutates shared weights', () => {
    const r = scoreRisk({ usableStock: 2, forecastWeeklyDemand: 30, trailingDemand: 10, inbound: 0, expiring14d: 2, nearbySurplus: null });
    expect(r.factors.network_scarcity).toBe(0);
    expect(r.band).toBeDefined();
  });
});
