import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
export const runtime = 'nodejs';

const schema = z.object({ question: z.string().min(3).max(500) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION' } }, { status: 422 });
  const q = parsed.data.question.toLowerCase();

  if (/patient|donor name|aadhaar|phone number|medical record/.test(q)) {
    return NextResponse.json({ answer: 'I cannot discuss patient or donor-level information. HemoNexus only stores grouped, simulated inventory data.', sources: [], refused: true, dataMode: 'SIMULATED' });
  }
  if (/approve|authorize|clinically suitable|transfuse/.test(q)) {
    return NextResponse.json({ answer: 'I cannot approve transfers or determine clinical suitability. A qualified human reviewer must sign off under your institution’s approved protocol.', sources: [], refused: true, dataMode: 'SIMULATED' });
  }

  const scores = await prisma.riskScore.findMany({ include: { institution: true }, orderBy: { raw: 'desc' }, take: 5 });
  const asOf = new Date().toISOString();
  if (/risk|shortage|critical|why/.test(q)) {
    const top = scores[0];
    if (!top) return NextResponse.json({ answer: 'No risk scores are available yet. Run the scoring pipeline first.', sources: [], dataMode: 'SIMULATED' });
    const factors = JSON.parse(top.factors || '{}');
    const lines = Object.entries(factors).map(([k, v]) => `- ${k}: ${Number(v).toFixed(2)}`);
    return NextResponse.json({
      answer: `The highest current simulated risk is ${top.institution?.name} (${top.group}/${top.component}), band ${top.band}. Contributing factors:\n${lines.join('\n')}\nThis is decision support only; a qualified reviewer decides clinical action.`,
      sources: [`/api/v1/scores?institutionId=${top.institutionId}`], asOf, dataMode: 'SIMULATED',
    });
  }
  if (/inventory|stock|unit|expiry/.test(q)) {
    const [units, ineligible] = await Promise.all([
      prisma.bloodUnit.count(),
      prisma.bloodUnit.count({ where: { OR: [{ quarantineState: { not: 'IN_STOCK' } }, { excursionOpen: true }, { qualityVerified: false }] } }),
    ]);
    return NextResponse.json({
      answer: `The simulated network holds ${units} recorded units. ${ineligible} are currently excluded from eligible stock because of quarantine, quality or temperature issues. Eligibility is recorded from verified facts, not decided by AI.`,
      sources: ['/api/v1/inventory/units'], asOf, dataMode: 'SIMULATED',
    });
  }
  if (/simulation|what if/.test(q)) {
    return NextResponse.json({ answer: 'Use the Simulation page to apply hypothetical demand or supply changes. Results are clearly labelled SIMULATION — NOT A FORECAST and never alter live inventory.', sources: ['/api/v1/simulations'], asOf, dataMode: 'SIMULATED' });
  }
  return NextResponse.json({ answer: 'I can explain current simulated shortage risk, inventory eligibility, and simulations using platform data only. I do not provide medical advice or clinical decisions.', sources: [], asOf, dataMode: 'SIMULATED' });
}
