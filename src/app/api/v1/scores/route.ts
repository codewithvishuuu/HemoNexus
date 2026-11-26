import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { computeScore } from '@/lib/domain';
import { guard, scopedInstitutionFilter } from '@/lib/guard';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const g = await guard();
  if (g instanceof NextResponse) return g;
  const url = new URL(req.url);
  const institutionId = url.searchParams.get('institutionId');
  const scope = scopedInstitutionFilter(g.user);
  if (institutionId) {
    if (scope && institutionId !== scope) return NextResponse.json({ error: { code: 'CROSS_INSTITUTION', message: 'Access denied' } }, { status: 403 });
    const result = await computeScore(institutionId, url.searchParams.get('group') ?? 'O-', url.searchParams.get('component') ?? 'RBC');
    return NextResponse.json({ ...result, asOf: new Date().toISOString(), dataMode: 'SIMULATED', weightsVersion: 'weights-v1' });
  }
  const rows = await prisma.riskScore.findMany({
    where: scope ? { institutionId: scope } : {},
    include: { institution: true }, orderBy: { raw: 'desc' }, take: 100,
  });
  return NextResponse.json({ scores: rows, scope: scope ?? 'NETWORK', asOf: new Date().toISOString(), dataMode: 'SIMULATED' });
}

export async function POST() {
  const g = await guard();
  if (g instanceof NextResponse) return g;
  if (!['REGIONAL_COORDINATOR', 'PLATFORM_ADMIN'].includes(g.user.role)) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only coordinators may recompute network scores' } }, { status: 403 });
  }
  const scores = [];
  const institutions = await prisma.institution.findMany({ select: { id: true } });
  for (const inst of institutions) {
    for (const group of ['O-', 'A+', 'AB-', 'B+']) scores.push(await computeScore(inst.id, group, 'RBC'));
  }
  return NextResponse.json({ computed: scores.length, state: 'OK', asOf: new Date().toISOString() });
}
