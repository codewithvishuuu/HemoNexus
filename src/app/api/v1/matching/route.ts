import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { matchingCandidates } from '@/lib/domain';
export const runtime = 'nodejs';

const schema = z.object({ fromId: z.string(), group: z.string(), component: z.string(), radiusKm: z.number().positive().max(500).default(150) });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = schema.safeParse({
    fromId: url.searchParams.get('fromId'), group: url.searchParams.get('group') ?? 'O-',
    component: url.searchParams.get('component') ?? 'RBC', radiusKm: Number(url.searchParams.get('radiusKm') ?? 150),
  });
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION', message: 'Invalid matching query' } }, { status: 422 });
  const candidates = await matchingCandidates({
    fromId: String(parsed.data.fromId ?? ''), group: String(parsed.data.group ?? 'O-'),
    component: String(parsed.data.component ?? 'RBC'), radiusKm: Number(parsed.data.radiusKm ?? 150),
  });
  return NextResponse.json({ candidates, ruleVersion: 'compatibility-v1', asOf: new Date().toISOString(), dataMode: 'SIMULATED' });
}
