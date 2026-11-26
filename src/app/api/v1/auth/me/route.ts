import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
export const runtime = 'nodejs';
export async function GET() {
  const s = await requireUser();
  return NextResponse.json({ user: s ? { id: s.sub, email: s.user.email, role: s.role, institutionId: s.institutionId, name: s.user.name } : null });
}
