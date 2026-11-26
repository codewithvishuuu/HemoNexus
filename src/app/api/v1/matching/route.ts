import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { matchingCandidates } from '@/lib/domain';
import { guard, scopedInstitutionFilter } from '@/lib/guard';
export const runtime = 'nodejs';

const schema = z.object({ fromId: z.string().min(1), group: z.string().min(1), component: z.string().min(1), radiusKm: z.number().positive().max(500).default(150) });

export async function GET(req: Request) {
  const g = await guard();
  if (g instanceof NextResponse) return g;
  const url = new URL(req.url);
  const parsed = schema.safeParse({
    fromId: url.searchParams.get('fromId'), group: url.searchParams.get('group') ?? 'O-',
    component: url.searchParams.get('component') ?? 'RBC', radiusKm: Number(url.searchParams.get('radiusKm') ?? 150),
  });
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION', message: 'Invalid matching query' } }, { status: 422 });
  const fromId = String(parsed.data.fromId);
  const scope = scopedInstitutionFilter(g.user);
  if (scope && fromId !== scope) return NextResponse.json({ error: { code: 'CROSS_INSTITUTION', message: 'Access denied' } }, { status: 403 });
  const exists = await prisma.institution.findUnique({ where: { id: fromId } });
  if (!exists) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Source institution not found' } }, { status: 404 });
  const candidates = await matchingCandidates({
    fromId, group: String(parsed.data.group), component: String(parsed.data.component), radiusKm: Number(parsed.data.radiusKm),
  });
  return NextResponse.json({ candidates, ruleVersion: 'compatibility-v1', asOf: new Date().toISOString(), dataMode: 'SIMULATED' });
}
