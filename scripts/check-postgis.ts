import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis')
  .then(() => p.$queryRawUnsafe('SELECT postgis_version() AS v'))
  .then((r: any) => { console.log('PostGIS version:', (r as any)[0]?.v); })
  .catch((e: any) => { console.log('PostGIS unavailable:', String(e.message).slice(0, 200)); })
  .finally(() => p.$disconnect());
