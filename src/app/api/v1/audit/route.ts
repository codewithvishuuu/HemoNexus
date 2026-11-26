import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 });
  if (user.role !== 'PLATFORM_ADMIN' && user.role !== 'REGIONAL_COORDINATOR') {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }
  const entity = new URL(req.url).searchParams.get('entity');
  const events = await prisma.auditLog.findMany({ where: entity ? { entity } : {}, orderBy: { at: 'desc' }, take: 200 });
  return NextResponse.json({ events, count: events.length, dataMode: 'SIMULATED' });
}
