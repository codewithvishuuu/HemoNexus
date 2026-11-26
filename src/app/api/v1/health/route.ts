import { NextResponse } from 'next/server';
import { prisma, SEED } from '@/lib/db';
export const runtime = 'nodejs';

export async function GET() {
  const institutions = await prisma.institution.count();
  return NextResponse.json({ status: 'ok', service: 'hemonexus-domain', seed: SEED, institutions, dataMode: 'SIMULATED', time: new Date().toISOString() });
}
