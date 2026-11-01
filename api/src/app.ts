import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { AppError } from './errors';
import { PensService } from './pens.service';
import { GRINDS, NIB_SIZES, STATUSES } from './types';

const createSchema = z.object({
  code: z.string().min(1).max(20),
  customer: z.string().min(1).max(120),
  penBrand: z.string().min(1).max(120),
  nibSize: z.enum(NIB_SIZES),
  grind: z.enum(GRINDS),
  issue: z.string().min(1).max(200),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(STATUSES).optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
});

const updateSchema = createSchema.partial();

export function createApp(service = new PensService()) {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(',') ?? [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ],
    }),
  );
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({
      service: 'Nibwell',
      version: '1.0.0',
      health: '/health',
      jobs: '/api/jobs',
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Nibwell' });
  });

  app.get('/api/jobs', (req, res, next) => {
    try {
      const status = req.query.status
        ? z.enum(STATUSES).parse(req.query.status)
        : undefined;
      const grind = req.query.grind
        ? z.enum(GRINDS).parse(req.query.grind)
        : undefined;
      const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      res.json(service.findAll({ status, grind, tag, q }));
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/jobs/:id', (req, res, next) => {
    try {
      res.json(service.findOne(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/jobs', (req, res, next) => {
    try {
      const payload = createSchema.parse(req.body);
      res.status(201).json(service.create(payload));
    } catch (err) {
      next(err);
    }
  });

  app.patch('/api/jobs/:id', (req, res, next) => {
    try {
      const payload = updateSchema.parse(req.body);
      res.json(service.update(req.params.id, payload));
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/jobs/:id', (req, res, next) => {
    try {
      service.remove(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/jobs/:id/advance', (req, res, next) => {
    try {
      res.json(service.advance(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/jobs/:id/grind', (req, res, next) => {
    try {
      res.json(service.grind(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/jobs/:id/tune', (req, res, next) => {
    try {
      res.json(service.tune(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/jobs/:id/test', (req, res, next) => {
    try {
      res.json(service.writingTest(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/jobs/:id/ready', (req, res, next) => {
    try {
      res.json(service.markReady(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/jobs/:id/pickup', (req, res, next) => {
    try {
      res.json(service.pickup(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        message: err.issues.map((issue) => issue.message).join(', '),
      });
      return;
    }
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}
