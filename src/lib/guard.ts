import { NextResponse } from 'next/server';
import { requireUser } from './auth';

const NETWORK_ROLES = new Set(['PLATFORM_ADMIN', 'REGIONAL_COORDINATOR', 'ANALYST', 'CLINICAL_REVIEWER']);

/** Returns an authenticated session or a 401 response. */
export async function guard(): Promise<{ user: any } | NextResponse> {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } }, { status: 401 });
  return { user };
}

/** Institution scoping for read models. Managers may only read their own institution. */
export function scopedInstitutionFilter(user: any): any {
  if (NETWORK_ROLES.has(user.role)) return undefined;
  return user.institutionId ?? '__no_institution__';
}

export function isNetworkRole(user: any) { return NETWORK_ROLES.has(user.role); }
