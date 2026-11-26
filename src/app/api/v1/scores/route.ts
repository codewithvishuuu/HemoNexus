import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { computeScore } from '@/lib/domain';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const institutionId = url.searchParams.get('institutionId');
  const group = url.searchParams.get('group') ?? 'O-';
  const component = url.searchParams.get('component') ?? 'RBC';
  if (institutionId) {
    const result = await computeScore(institutionId, group, component);
    return NextResponse.json({ ...result, asOf: new Date().toISOString(), dataMode: 'SIMULATED', weightsVersion: 'weights-v1' });
  }
  const rows = await prisma.riskScore.findMany({ include: { institution: true }, orderBy: { raw: 'desc' }, take: 100 });
  return NextResponse.json({ scores: rows, asOf: new Date().toISOString(), dataMode: 'SIMULATED' });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const scores = [];
  const institutions = await prisma.institution.findMany({ select: { id: true } });
  for (const inst of institutions) {
    for (const group of ['O-', 'A+', 'AB-', 'B+']) {
      scores.push(await computeScore(inst.id, group, body.component ?? 'RBC'));
    }
  }
  return NextResponse.json({ computed: scores.length, state: 'OK', asOf: new Date().toISOString() });
}
