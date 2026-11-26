import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { eligible, freshness, haversine } from '@/lib/domain';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const group = url.searchParams.get('group') ?? undefined;
  const component = url.searchParams.get('component') ?? undefined;
  const eligibleOnly = url.searchParams.get('eligibleOnly') === 'true';
  const where: any = {};
  if (group) where.group = group;
  if (component) where.component = component;
  const units = await prisma.bloodUnit.findMany({ where, include: { institution: true }, take: 500 });
  const filtered = eligibleOnly ? units.filter(eligible) : units;
  return NextResponse.json({
    units: filtered.map((u) => ({
      id: u.id, group: u.group, component: u.component, institution: u.institution?.name,
      institutionId: u.institutionId, expiresAt: u.expiresAt, storageCondition: u.storageCondition,
      quarantineState: u.quarantineState, qualityVerified: u.qualityVerified, excursionOpen: u.excursionOpen,
      eligible: eligible(u), temperatureC: u.temperatureC,
    })),
    total: filtered.length, asOf: new Date().toISOString(), dataMode: 'SIMULATED',
  });
}
