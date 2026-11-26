import { NextResponse } from 'next/server';
import { getSeries, runBacktest } from '@/lib/domain';
import { forecast } from '@/lib/analytics';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const region = url.searchParams.get('region') ?? 'East';
  const group = url.searchParams.get('group') ?? 'O-';
  const component = url.searchParams.get('component') ?? 'RBC';
  const series = await getSeries(region, group, component);
  const bt = await runBacktest(region, group, component);
  const f = forecast(series, 4, (bt.selectedModel?.startsWith('seasonal') ? 'naive' : 'ets') as any);
  return NextResponse.json({ region, group, component, series, forecast: f, backtest: bt, asOf: new Date().toISOString(), dataMode: 'SIMULATED' });
}
