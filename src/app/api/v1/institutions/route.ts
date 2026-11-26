import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { guard, scopedInstitutionFilter } from '@/lib/guard';
export const runtime = 'nodejs';

export async function GET() {
  const g = await guard();
  if (g instanceof NextResponse) return g;
  const scope = scopedInstitutionFilter(g.user);
  const institutions = await prisma.institution.findMany({
    where: scope ? { id: scope } : {},
    include: { _count: { select: { units: true, scores: true } } }, orderBy: { name: 'asc' },
  });
  return NextResponse.json({ institutions, asOf: new Date().toISOString(), dataMode: 'SIMULATED' });
}
