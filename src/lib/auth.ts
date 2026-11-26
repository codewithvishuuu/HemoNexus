import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './db';

export const ROLES = ['PLATFORM_ADMIN', 'REGIONAL_COORDINATOR', 'HOSPITAL_MANAGER', 'BLOOD_BANK_MANAGER', 'ANALYST', 'CLINICAL_REVIEWER'] as const;
export type Role = (typeof ROLES)[number];

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is not configured');
  return new TextEncoder().encode(value);
};

export async function hashPassword(password: string) { return bcrypt.hash(password, 10); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }

export async function signToken(payload: { sub: string; role: Role; institutionId: string | null; name: string }) {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(secret());
}

export async function readToken(token?: string) {
  if (!token) return null;
  try { return (await jwtVerify(token, secret())).payload as any; } catch { return null; }
}

export async function session() {
  const store = await cookies();
  return readToken(store.get('hemonexus_session')?.value);
}

export function can(role: Role, action: string, institutionId?: string | null, targetInstitutionId?: string | null): boolean {
  if (role === 'PLATFORM_ADMIN') return action === 'admin';
  if (action === 'admin') return false;
  if (action === 'transfer:request') return ['REGIONAL_COORDINATOR', 'HOSPITAL_MANAGER', 'BLOOD_BANK_MANAGER'].includes(role);
  if (action === 'alert:ack') return ['REGIONAL_COORDINATOR', 'HOSPITAL_MANAGER', 'BLOOD_BANK_MANAGER'].includes(role);
  if (action === 'clinical:approve') return role === 'CLINICAL_REVIEWER';
  if (action === 'inventory:write') {
    if (!['HOSPITAL_MANAGER', 'BLOOD_BANK_MANAGER'].includes(role)) return false;
    return institutionId === targetInstitutionId;
  }
  return ROLES.includes(role);
}

export async function requireUser() {
  const s = await session();
  if (!s) return null;
  const user = await prisma.user.findUnique({ where: { id: s.sub } });
  return user ? { ...s, email: user.email, user } : null;
}
