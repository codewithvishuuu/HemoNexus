import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';
export const runtime = 'nodejs';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION', message: 'Invalid credentials payload' } }, { status: 422 });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } }, { status: 401 });
  }
  const token = await signToken({ sub: user.id, role: user.role as any, institutionId: user.institutionId, name: user.name });
  const res = NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, institutionId: user.institutionId, name: user.name } });
  res.cookies.set('hemonexus_session', token, { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', path: '/', maxAge: 28800 });
  return res;
}
