import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { audit, eligible } from '@/lib/domain';
export const runtime = 'nodejs';

const createSchema = z.object({ fromId: z.string(), toId: z.string(), group: z.string(), component: z.string(), units: z.number().int().positive(), unitId: z.string().optional() });

export async function GET() {
  const requests = await prisma.transferRequest.findMany({ include: { approvals: true, reservations: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  return NextResponse.json({ requests, asOf: new Date().toISOString(), dataMode: 'SIMULATED' });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || !can(user.role as any, 'transfer:request')) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Role cannot create transfer requests' } }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION', message: 'Invalid transfer request' } }, { status: 422 });
  const key = req.headers.get('idempotency-key') ?? `${parsed.data.fromId}-${parsed.data.toId}-${parsed.data.group}-${Date.now()}`;

  const existing = await prisma.transferRequest.findUnique({ where: { idempotencyKey: key } });
  if (existing) return NextResponse.json({ request: existing, replay: true });

  const unitId = parsed.data.unitId ?? (await prisma.bloodUnit.findFirst({
    where: { institutionId: parsed.data.fromId, group: parsed.data.group, component: parsed.data.component },
  }))?.id;
  if (!unitId) return NextResponse.json({ error: { code: 'NO_UNIT', message: 'No matching unit at source institution' } }, { status: 404 });
  const unit = await prisma.bloodUnit.findUniqueOrThrow({ where: { id: unitId } });
  if (!eligible(unit)) {
    return NextResponse.json({ error: { code: 'UNIT_INELIGIBLE', message: 'Unit has an unresolved quality, cold-chain or reservation issue' } }, { status: 409 });
  }

  try {
    const request = await prisma.$transaction(async (tx) => {
      const active = await tx.reservation.findFirst({ where: { unitId, state: 'ACTIVE', expiresAt: { gt: new Date() } } });
      if (active) throw new Error('RESERVATION_CONFLICT');
      const r = await tx.transferRequest.create({ data: {
        fromId: String(parsed.data.fromId), toId: String(parsed.data.toId),
        group: String(parsed.data.group), component: String(parsed.data.component),
        units: Number(parsed.data.units), idempotencyKey: key,
      } });
      await tx.reservation.create({
        data: { unitId, requestId: r.id, idempotencyKey: key, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
      });
      await tx.bloodUnit.update({ where: { id: unitId }, data: { reserved: true } });
      await tx.auditLog.create({
        data: { actor: user.email, action: 'TRANSFER_REQUESTED', entity: r.id, summary: JSON.stringify(parsed.data), institutionId: parsed.data.fromId },
      });
      return r;
    });
    return NextResponse.json({ request, state: 'PENDING_APPROVAL', dataMode: 'SIMULATED' }, { status: 201 });
  } catch (e: any) {
    if (String(e.message).includes('RESERVATION_CONFLICT')) {
      return NextResponse.json({ error: { code: 'RESERVATION_CONFLICT', message: 'Unit is already reserved' } }, { status: 409 });
    }
    throw e;
  }
}
