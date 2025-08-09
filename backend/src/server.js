import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Auth très simple: header x-admin-token doit matcher ADMIN_TOKEN
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// USERS (members)
const userSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  role: z.enum(['PRESIDENT','VICE_PRESIDENT','SECRETARY_GENERAL','SECRETARY_ADJOINT','SPOKESPERSON','SPOKESPERSON_ADJOINT','TREASURER','TREASURER_ADJOINT','MEMBER']).optional(),
  antennaId: z.number().int().optional()
});

app.get('/users', requireAdmin, async (req, res) => {
  const data = await prisma.user.findMany({ include: { antenna: true } });
  res.json(data);
});

app.post('/users', requireAdmin, async (req, res) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const user = await prisma.user.create({ data: parsed.data });
  await prisma.activity.create({ data: { userId: user.id, action: 'USER_CREATED' }});
  res.json(user);
});

app.get('/users/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({ where: { id }, include:{ payments:true, activities:true, antenna:true } });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

app.put('/users/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = userSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const user = await prisma.user.update({ where: { id }, data: parsed.data });
  await prisma.activity.create({ data: { userId: id, action: 'USER_UPDATED' }});
  res.json(user);
});

app.delete('/users/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
});

// ANTENNAS
app.get('/antennas', requireAdmin, async (_req, res) => {
  res.json(await prisma.antenna.findMany({ include: { members: true } }));
});

app.post('/antennas', requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  res.json(await prisma.antenna.create({ data: { name } }));
});

// AFFECTATION (demande simple v1)
app.post('/antennas/:id/assign', requireAdmin, async (req, res) => {
  const antennaId = Number(req.params.id);
  const { userId } = req.body;
  const user = await prisma.user.update({ where: { id: Number(userId) }, data: { antennaId } });
  await prisma.activity.create({ data: { userId: user.id, action: 'AFFECTATION_CHANGED' }});
  res.json(user);
});

// QUOTA SETTINGS
app.get('/quota-settings', requireAdmin, async (_req, res) => {
  res.json(await prisma.quotaSetting.findMany());
});

app.post('/quota-settings', requireAdmin, async (req, res) => {
  const { period, amount, year } = req.body;
  res.json(await prisma.quotaSetting.create({ data: { period, amount, year } }));
});

// CONTRIBUTIONS (cotisations)
app.get('/contributions', requireAdmin, async (_req, res) => {
  res.json(await prisma.contribution.findMany({ include:{ project:true } }));
});

app.post('/contributions', requireAdmin, async (req, res) => {
  const { name, projectId, startAt, endAt, organizedBy } = req.body;
  res.json(await prisma.contribution.create({
    data: { name, projectId, startAt: new Date(startAt), endAt: new Date(endAt), organizedBy }
  }));
});

app.get('/contributions/:id/payments', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  res.json(await prisma.contributionPayment.findMany({ where:{ contributionId:id }, include:{ user:true } }));
});

// PROJECTS
app.get('/projects', async (_req, res) => {
  const data = await prisma.project.findMany({ orderBy:{ createdAt:'desc' } });
  res.json(data);
});

app.post('/projects', requireAdmin, async (req, res) => {
  const { name, description, slug, image, startAt, endAt, status } = req.body;
  res.json(await prisma.project.create({ data: { name, description, slug, image, startAt, endAt, status } }));
});

app.put('/projects/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  res.json(await prisma.project.update({ where:{ id }, data: req.body }));
});

// PROJECT SUGGEST
app.get('/project-suggests', requireAdmin, async (_req, res) => {
  res.json(await prisma.projectSuggest.findMany({ orderBy:{ createdAt:'desc' }, include:{ user:true } }));
});

app.post('/project-suggests', async (req, res) => {
  // accessible aux membres (pas besoin admin)
  const { name, description, userId } = req.body;
  res.json(await prisma.projectSuggest.create({ data: { name, description, userId } }));
});

app.post('/project-suggests/:id/review', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status, read } = req.body;
  res.json(await prisma.projectSuggest.update({ where:{ id }, data:{ status, read } }));
});

// EVENTS
app.get('/events', async (_req, res) => {
  res.json(await prisma.event.findMany({ orderBy:{ createdAt:'desc' } }));
});

app.post('/events', async (req, res) => {
  // membre propose un évènement
  const { title, scope, antennaId, startAt, endAt, createdBy } = req.body;
  res.json(await prisma.event.create({ data:{ title, scope, antennaId, startAt, endAt, createdBy } }));
});

app.post('/events/:id/approve', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  res.json(await prisma.event.update({ where:{ id }, data:{ approved:true } }));
});

// DOCUMENTS
app.get('/documents', async (_req, res) => {
  res.json(await prisma.document.findMany());
});

app.post('/documents', requireAdmin, async (req, res) => {
  const { title, url } = req.body;
  res.json(await prisma.document.create({ data:{ title, url } }));
});

app.post('/documents/:id/archive', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  res.json(await prisma.document.update({ where:{ id }, data:{ archived:true } }));
});

// VOTES (squelette)
app.get('/votes', async (_req, res) => {
  res.json(await prisma.vote.findMany());
});

app.post('/votes', requireAdmin, async (req, res) => {
  const { title, description, closesAt } = req.body;
  res.json(await prisma.vote.create({ data:{ title, description, closesAt } }));
});

// PAYMENTS (simple cash record, auto & cash placeholder)
app.post('/payments', requireAdmin, async (req, res) => {
  const { userId, amount, method, note } = req.body;
  const p = await prisma.payment.create({ data:{ userId, amount, method, note } });
  await prisma.activity.create({ data: { userId, action: 'PAYMENT_ADDED' }});
  res.json(p);
});

// DASHBOARD counters (per PDF: 8 derniers éléments etc.)
app.get('/dashboard', async (_req, res) => {
  const projects = await prisma.project.findMany({ where:{ status: 'ONGOING' }, take:8, orderBy:{ createdAt:'desc' } });
  const contributions = await prisma.contribution.findMany({ take:8, orderBy:{ createdAt:'desc' } });
  const events = await prisma.event.findMany({ where:{ approved:true }, take:8, orderBy:{ createdAt:'desc' } });
  res.json({ projects, contributions, events });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ API on http://localhost:${PORT}`));