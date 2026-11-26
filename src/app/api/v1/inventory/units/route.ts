import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { eligible } from '@/lib/domain';
import { guard, scopedInstitutionFilter } from '@/lib/guard';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const g = await guard();
  if (g instanceof NextResponse) return g;
  const url = new URL(req.url);
  const where: any = {};
  if (url.searchParams.get('group')) where.group = url.searchParams.get('group');
  if (url.searchParams.get('component')) where.component = url.searchParams.get('component');
  const scope = scopedInstitutionFilter(g.user);
  if (scope) where.institutionId = scope;
  const units = await prisma.bloodUnit.findMany({ where, include: { institution: true }, take: 500 });
  const filtered = url.searchParams.get('eligibleOnly') === 'true' ? units.filter(eligible) : units;
  return NextResponse.json({
    units: filtered.map((u) => ({
      id: u.id, group: u.group, component: u.component, institution: u.institution?.name,
      institutionId: u.institutionId, expiresAt: u.expiresAt, storageCondition: u.storageCondition,
      quarantineState: u.quarantineState, qualityVerified: u.qualityVerified, excursionOpen: u.excursionOpen,
      eligible: eligible(u), temperatureC: u.temperatureC,
    })),
    total: filtered.length, scope: scope ?? 'NETWORK', asOf: new Date().toISOString(), dataMode: 'SIMULATED',
  });
}
