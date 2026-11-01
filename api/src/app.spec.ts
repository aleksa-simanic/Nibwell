import request from 'supertest';
import { createApp } from './app';
import { PensService } from './pens.service';

describe('Nibwell API', () => {
  const app = createApp(new PensService());

  it('returns health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.service).toBe('Nibwell');
  });

  it('creates, advances, and deletes a job', async () => {
    const created = await request(app)
      .post('/api/jobs')
      .send({
        code: 'nw-400',
        customer: 'Jordan Lee',
        penBrand: 'TWSBI Eco',
        nibSize: 'm',
        grind: 'architect',
        issue: 'Architect grind for notes',
        dueOn: '2026-09-05',
        tags: ['notes'],
      });

    expect(created.status).toBe(201);
    expect(created.body.code).toBe('NW-400');
    const id = created.body.id as string;

    const advanced = await request(app).post(`/api/jobs/${id}/advance`);
    expect(advanced.status).toBe(200);
    expect(advanced.body.status).toBe('grinding');

    const deleted = await request(app).delete(`/api/jobs/${id}`);
    expect(deleted.status).toBe(204);
  });

  it('rejects empty codes', async () => {
    const response = await request(app).post('/api/jobs').send({
      code: '',
      customer: 'Sam Ortega',
      penBrand: 'Lamy',
      nibSize: 'f',
      grind: 'stock',
      issue: 'Tune',
      dueOn: '2026-09-01',
    });
    expect(response.status).toBe(400);
  });
});
