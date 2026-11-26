import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { audit } from '@/lib/domain';
export const runtime = 'nodejs';

const schema = z.object({ requestId: z.string(), checkpoint: z.enum(['SENDING_INSTITUTION', 'RECEIVING_INSTITUTION', 'CLINICAL_REVIEWER']), note: z.string().optional() });

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION' } }, { status: 422 });

  if (parsed.data.checkpoint === 'CLINICAL_REVIEWER' && !can(user.role as any, 'clinical:approve')) {
    return NextResponse.json({ error: { code: 'CLINICAL_APPROVAL_DENIED', message: 'Only a qualified clinical reviewer may sign off' } }, { status: 403 });
  }
  const request = await prisma.transferRequest.findUnique({ where: { id: parsed.data.requestId } });
  if (!request) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Transfer request not found' } }, { status: 404 });

  if (parsed.data.checkpoint !== 'CLINICAL_REVIEWER') {
    const institutionalRoles = ['PLATFORM_ADMIN', 'REGIONAL_COORDINATOR', 'HOSPITAL_MANAGER', 'BLOOD_BANK_MANAGER'];
    if (!institutionalRoles.includes(user.role)) {
      return NextResponse.json({ error: { code: 'INSTITUTIONAL_APPROVAL_DENIED', message: 'This role cannot sign institutional checkpoints' } }, { status: 403 });
    }
    if (['HOSPITAL_MANAGER', 'BLOOD_BANK_MANAGER'].includes(user.role)) {
      const targetInstitution = parsed.data.checkpoint === 'SENDING_INSTITUTION' ? request.fromId : request.toId;
      if (user.institutionId !== targetInstitution) {
        return NextResponse.json({ error: { code: 'CROSS_INSTITUTION', message: 'Signer is not a member of the relevant institution' } }, { status: 403 });
      }
    }
  }

  const approvals = await prisma.approval.findMany({ where: { requestId: request.id } });
  const done = new Set(approvals.map((a) => a.checkpoint));
  if (done.has(parsed.data.checkpoint)) return NextResponse.json({ error: { code: 'DUPLICATE_APPROVAL' } }, { status: 409 });
  if (parsed.data.checkpoint === 'SENDING_INSTITUTION' && done.has('CLINICAL_REVIEWER')) {
    return NextResponse.json({ error: { code: 'INVALID_ORDER' } }, { status: 409 });
  }
  await prisma.$transaction([
    prisma.approval.create({ data: { requestId: request.id, checkpoint: parsed.data.checkpoint, actor: user.email, note: parsed.data.note } }),
    prisma.auditLog.create({ data: { actor: user.email, action: `APPROVAL_${parsed.data.checkpoint}`, entity: request.id, summary: JSON.stringify({ note: parsed.data.note ?? '' }) } }),
  ]);
  done.add(parsed.data.checkpoint);
  const next = !done.has('SENDING_INSTITUTION') ? 'PENDING_SENDING' : !done.has('RECEIVING_INSTITUTION') ? 'PENDING_RECEIVING' : !done.has('CLINICAL_REVIEWER') ? 'PENDING_CLINICAL' : 'APPROVED';
  await prisma.transferRequest.update({ where: { id: request.id }, data: { state: next } });
  return NextResponse.json({ state: next, approvals: [...done], note: 'Human checkpoints only; clinical usability is not decided by software' });
}
