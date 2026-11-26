import express from 'express';
import cors from 'cors';
import { prisma, SEED } from '../src/lib/db';
import { computeScore, runBacktest, matchingCandidates, runSimulation, eligible } from '../src/lib/domain';

const app = express();
app.use(cors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','), credentials: true }));
app.use(express.json());

app.get('/health', async (_req, res) => res.json({ status: 'ok', service: 'hemonexus-express', seed: SEED, dataMode: 'SIMULATED' }));
app.get('/v1/institutions', async (_req, res) => res.json({ institutions: await prisma.institution.findMany() }));
app.get('/v1/inventory/units', async (req, res) => {
  const where: any = {};
  if (req.query.group) where.group = req.query.group;
  if (req.query.component) where.component = req.query.component;
  const units = await prisma.bloodUnit.findMany({ where, take: 500 });
  res.json({ units: units.map((u) => ({ ...u, eligible: eligible(u) })), dataMode: 'SIMULATED' });
});
app.get('/v1/scores/:institutionId', async (req, res) => {
  res.json(await computeScore(req.params.institutionId, String(req.query.group ?? 'O-'), String(req.query.component ?? 'RBC')));
});
app.get('/v1/forecasts', async (req, res) => {
  res.json(await runBacktest(String(req.query.region ?? 'East'), String(req.query.group ?? 'O-'), String(req.query.component ?? 'RBC')));
});
app.get('/v1/matching', async (req, res) => {
  res.json(await matchingCandidates({ fromId: String(req.query.fromId), group: String(req.query.group ?? 'O-'), component: String(req.query.component ?? 'RBC'), radiusKm: Number(req.query.radiusKm ?? 150) }));
});
app.post('/v1/simulations', async (req, res) => res.json(await runSimulation(req.body)));
app.get('/v1/audit', async (_req, res) => res.json({ events: await prisma.auditLog.findMany({ orderBy: { at: 'desc' }, take: 100 }) }));

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`HemoNexus Express API listening on http://localhost:${port}`));
