// Isolated backup/restore drill. Uses a COPY of the local dev database only.
// Never connects to production. No production data is touched.
import { PrismaClient } from '@prisma/client';
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.DRILL_DIR!;
const source = join(process.cwd(), 'prisma', 'dev.db');
const backup = join(dir, 'backup.db');
const live = join(dir, 'drill.db');

async function count(url: string) {
  process.env.DATABASE_URL = url;
  const p = new PrismaClient({ datasources: { db: { url } } });
  const n = await p.bloodUnit.count();
  await p.$disconnect();
  return n;
}

async function main() {
  if (!existsSync(source)) throw new Error('Local dev DB not found - drill aborted');
  copyFileSync(source, backup);
  copyFileSync(backup, live);
  const before = await count(`file:${live}`);
  const p = new PrismaClient({ datasources: { db: { url: `file:${live}` } } });
  const one = await p.bloodUnit.findFirst({ where: { quarantineState: 'IN_STOCK' } });
  if (!one) throw new Error('No unit to delete');
  await p.bloodUnit.delete({ where: { id: one.id } });
  await p.$disconnect();
  const afterDelete = await count(`file:${live}`);
  copyFileSync(backup, live); // restore
  const afterRestore = await count(`file:${live}`);
  console.log(JSON.stringify({ before, afterDelete, afterRestore, restored: afterRestore === before, deletedUnitId: one.id.slice(-8) }));
  if (afterRestore !== before) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });
