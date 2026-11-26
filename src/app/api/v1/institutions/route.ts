import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export const runtime = 'nodejs';

export async function GET() {
  const institutions = await prisma.institution.findMany({
    include: { _count: { select: { units: true, scores: true } } }, orderBy: { name: 'asc' },
  });
  return NextResponse.json({ institutions, asOf: new Date().toISOString(), dataMode: 'SIMULATED' });
}
