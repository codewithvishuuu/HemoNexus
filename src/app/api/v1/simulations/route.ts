import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runSimulation } from '@/lib/domain';
import { guard } from '@/lib/guard';
export const runtime = 'nodejs';

const schema = z.object({
  scenario: z.enum(['DEMAND_SURGE', 'O_NEGATIVE_EMERGENCY', 'INVENTORY_LOSS', 'REGIONAL_SHORTAGE', 'ADDED_DONATIONS']),
  surgePct: z.number().min(-90).max(500).default(30),
  fromInstitutionId: z.string().optional(), group: z.string().optional(), component: z.string().optional(), days: z.number().int().min(1).max(28).default(7),
});

export async function POST(req: Request) {
  const g = await guard();
  if (g instanceof NextResponse) return g;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'SIMULATION_INPUT_ERROR', message: 'Invalid scenario inputs' }, state: 'SIMULATION_INPUT_ERROR' }, { status: 422 });
  const result = await runSimulation({ ...parsed.data, scenario: String(parsed.data.scenario ?? 'DEMAND_SURGE') } as any);
  return NextResponse.json(result);
}

export async function GET() {
  const g = await guard();
  if (g instanceof NextResponse) return g;
  const runs = await (await import('@/lib/db')).prisma.simulationRun.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  return NextResponse.json({ runs, dataMode: 'SIMULATED' });
}
