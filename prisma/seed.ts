import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SEED = 42;
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['RBC', 'Plasma', 'Platelets'];
const RULES: Record<string, any> = {
  RBC: { storageMin: 2, storageMax: 6, shelfLifeDays: 42, transportMin: 2, transportMax: 10, source: 'e-RaktKosh public guidance (verified 2026-11-26)', version: 'v1' },
  Plasma: { storageMin: -30, storageMax: -18, shelfLifeDays: 365, transportMin: -30, transportMax: -18, source: 'e-RaktKosh public guidance (verified 2026-11-26)', version: 'v1' },
  Platelets: { storageMin: 20, storageMax: 24, shelfLifeDays: 5, transportMin: 20, transportMax: 24, source: 'e-RaktKosh public guidance (verified 2026-11-26)', version: 'v1' },
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);
const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];

async function main() {
  console.log(`Seeding HemoNexus with deterministic seed ${SEED}`);
  await prisma.auditLog.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.transferRequest.deleteMany({});
  await prisma.excursionEvent.deleteMany({});
  await prisma.temperatureReading.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.riskScore.deleteMany({});
  await prisma.forecastSnapshot.deleteMany({});
  await prisma.dataTrustRecord.deleteMany({});
  await prisma.bloodUnit.deleteMany({});
  await prisma.consumptionEvent.deleteMany({});
  await prisma.donationEvent.deleteMany({});
  await prisma.componentRule.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.institution.deleteMany({});

  for (const [component, rule] of Object.entries(RULES)) {
    await prisma.componentRule.create({ data: { component, ...rule } });
  }

  const definitions = [
    ['Northbridge District Hospital', 'HOSPITAL', 'North', 28.61, 77.21],
    ['Pinecrest Medical Centre', 'HOSPITAL', 'North', 28.63, 77.18],
    ['Ridgeline General Hospital', 'HOSPITAL', 'North', 28.58, 77.26],
    ['Valleyview Community Hospital', 'HOSPITAL', 'East', 26.91, 75.79],
    ['Eastgate Trauma Centre', 'HOSPITAL', 'East', 26.94, 75.82],
    ['Lakeside District Hospital', 'HOSPITAL', 'East', 26.88, 75.74],
    ['Harbourstone Medical College', 'HOSPITAL', 'South', 19.07, 72.88],
    ['Southpoint Clinical Centre', 'HOSPITAL', 'South', 19.11, 72.85],
    ['Central Regional Blood Bank', 'BLOOD_BANK', 'North', 28.60, 77.23],
    ['Eastern Blood Storage Centre', 'BLOOD_BANK', 'East', 26.92, 75.80],
  ] as const;

  const institutions: any[] = [];
  for (const [name, type, region, lat, lng] of definitions) {
    institutions.push(await prisma.institution.create({
      data: { name: `${name} (SIMULATED)`, type, region, lat, lng, verified: true, isSimulated: true },
    }));
  }

  const today = new Date('2026-11-23T00:00:00Z');
  const week = 7 * 24 * 3600 * 1000;

  for (const inst of institutions) {
    for (const group of GROUPS) {
      for (const component of COMPONENTS) {
        const base = component === 'Platelets' ? 2 : component === 'Plasma' ? 4 : 8;
        const groupFactor = group.includes('-') ? 0.55 : 1;
        for (let w = 0; w < 104; w++) {
          const date = new Date(today.getTime() - (103 - w) * week);
          const season = 1 + 0.18 * Math.sin((w / 52) * 2 * Math.PI);
          const noise = 0.8 + rng() * 0.4;
          let units = Math.max(0, Math.round(base * groupFactor * season * noise));
          // seeded shortage events
          // Gradual ramp then surge: makes detection measurable before onset (lead time).
          if (group === 'O-' && component === 'RBC' && inst.region === 'East' && w >= 82 && w <= 87) {
            units = Math.round(units * (1 + (w - 81) * 0.12));
          }
          if ((group === 'O-' && component === 'RBC' && inst.region === 'East' && w >= 88 && w <= 94) ||
              (group === 'AB-' && component === 'Plasma' && inst.region === 'North' && w >= 96 && w <= 99)) {
            units = Math.round(units * 1.85);
          }
          if (units > 0) {
            await prisma.consumptionEvent.create({ data: { institutionId: inst.id, group, component, units, occurredAt: date } });
          }
        }
        // donation inflow
        for (let w = 0; w < 104; w += 2) {
          const date = new Date(today.getTime() - (103 - w) * week);
          await prisma.donationEvent.create({
            data: { institutionId: inst.id, group, units: Math.max(0, Math.round(base * groupFactor * (0.7 + rng() * 0.8))), arrivedAt: date, availableAt: new Date(date.getTime() + 2 * 24 * 3600 * 1000) },
          });
        }
        // units, including deliberate quality fixtures
        const shortageZone = group === 'O-' && component === 'RBC' && inst.region === 'East';
        const unitCount = Math.max(1, Math.round(base * groupFactor * (shortageZone ? 0.7 : 1.5)));
        for (let u = 0; u < unitCount; u++) {
          const isExcursion = inst.region === 'East' && group === 'O-' && component === 'RBC' && u === 0;
          const isQuarantined = inst.region === 'North' && group === 'AB-' && component === 'Platelets' && u === 0;
          const collected = new Date(today.getTime() - Math.floor(rng() * RULES[component].shelfLifeDays * 0.7) * 24 * 3600 * 1000);
          const expires = new Date(collected.getTime() + RULES[component].shelfLifeDays * 24 * 3600 * 1000);
          const unit = await prisma.bloodUnit.create({
            data: {
              institutionId: inst.id, group, component, collectedAt: collected, expiresAt: expires,
              storageCondition: RULES[component].source.includes('e-Rakt') ? `${RULES[component].storageMin}-${RULES[component].storageMax}C` : 'CONTROLLED',
              quarantineState: isQuarantined ? 'QUARANTINED' : 'IN_STOCK',
              qualityVerified: !isExcursion && !isQuarantined,
              excursionOpen: isExcursion,
              temperatureC: isExcursion ? 12 : (RULES[component].storageMin + RULES[component].storageMax) / 2,
              lastUpdateAt: new Date(today.getTime() - (inst.region === 'South' ? 4 * 24 * 3600 * 1000 : rng() * 12 * 3600 * 1000)),
            },
          });
          if (isExcursion) {
            await prisma.excursionEvent.create({ data: { unitId: unit.id, startedAt: new Date(today.getTime() - 6 * 3600 * 1000), reason: 'SIMULATED transport delay' } });
          }
        }
      }
    }
    const stale = inst.region === 'South';
    const incomplete = inst.name.includes('Lakeside');
    await prisma.dataTrustRecord.create({
      data: {
        institutionId: inst.id,
        lastUpdateAt: new Date(today.getTime() - (stale ? 4 * 24 * 3600 * 1000 : 1 * 3600 * 1000)),
        verificationState: 'VERIFIED',
        missingFields: incomplete ? JSON.stringify(['storageCondition']) : '[]',
        conflicts: '[]',
        staleFlag: stale,
        completenessPct: incomplete ? 80 : 100,
      },
    });
  }

  const passwordHash = await bcrypt.hash('HemoNexus!2026', 10);
  const users = [
    ['coordinator@simulated.local', 'REGIONAL_COORDINATOR', null, 'Regional Coordinator'],
    ['hospital@simulated.local', 'HOSPITAL_MANAGER', institutions[0].id, 'Hospital Manager'],
    ['bank@simulated.local', 'BLOOD_BANK_MANAGER', institutions[8].id, 'Bank Manager'],
    ['clinical@simulated.local', 'CLINICAL_REVIEWER', null, 'Clinical Reviewer (SIMULATED)'],
    ['analyst@simulated.local', 'ANALYST', null, 'Analyst'],
    ['admin@simulated.local', 'PLATFORM_ADMIN', null, 'Platform Admin'],
  ];
  for (const [email, role, institutionId, name] of users) {
    await prisma.user.create({ data: { email, passwordHash, role, institutionId: institutionId as any, name } });
  }

  const counts = {
    institutions: await prisma.institution.count(),
    units: await prisma.bloodUnit.count(),
    consumption: await prisma.consumptionEvent.count(),
    donations: await prisma.donationEvent.count(),
    users: await prisma.user.count(),
  };
  console.log('Seed complete:', JSON.stringify(counts));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
