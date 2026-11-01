import { AppError, ConflictError, NotFoundError } from './errors';
import { PensService } from './pens.service';

describe('PensService', () => {
  let service: PensService;

  beforeEach(() => {
    service = new PensService();
    service.clear();
    // Re-seed after clear by creating a fresh instance
    service = new PensService();
  });

  it('lists seeded pen jobs', () => {
    const all = service.findAll();
    expect(all.length).toBeGreaterThanOrEqual(3);
    expect(all.some((job) => job.code === 'NW-101')).toBe(true);
  });

  it('creates a job and normalizes tags', () => {
    const job = service.create({
      code: 'nw-200',
      customer: 'Sam Ortega',
      penBrand: 'Pilot Custom 74',
      nibSize: 'f',
      grind: 'italic',
      issue: 'Crisp italic',
      dueOn: '2026-09-01',
      tags: ['Studio', 'studio', 'gift'],
    });

    expect(job.code).toBe('NW-200');
    expect(job.tags).toEqual(['studio', 'gift']);
    expect(job.status).toBe('quoted');
  });

  it('rejects duplicate codes', () => {
    expect(() =>
      service.create({
        code: 'NW-101',
        customer: 'Dup',
        penBrand: 'Lamy',
        nibSize: 'm',
        grind: 'stock',
        issue: 'Tune only',
        dueOn: '2026-09-01',
      }),
    ).toThrow(ConflictError);
  });

  it('advances quoted through pickup', () => {
    const job = service.create({
      code: 'NW-300',
      customer: 'Amina Cole',
      penBrand: 'Sailor 1911',
      nibSize: 'm',
      grind: 'architect',
      issue: 'Architect grind',
      dueOn: '2026-09-05',
    });

    expect(service.advance(job.id).status).toBe('grinding');
    expect(service.advance(job.id).status).toBe('tuning');
    expect(service.advance(job.id).status).toBe('writing_test');
    expect(service.advance(job.id).status).toBe('ready');
    expect(service.advance(job.id).status).toBe('picked_up');
    expect(() => service.advance(job.id)).toThrow(AppError);
  });

  it('blocks invalid dedicated transitions', () => {
    const ready = service.findAll({ status: 'ready' })[0];
    expect(() => service.grind(ready.id)).toThrow(AppError);
  });

  it('filters by grind and query', () => {
    const italic = service.findAll({ grind: 'italic' });
    expect(italic.every((job) => job.grind === 'italic')).toBe(true);
    const q = service.findAll({ q: 'harbor' });
    expect(q).toHaveLength(1);
    expect(q[0].code).toBe('NW-102');
  });

  it('deletes a job', () => {
    const job = service.create({
      code: 'NW-DEL',
      customer: 'Temp',
      penBrand: 'Kaweco',
      nibSize: 'b',
      grind: 'stock',
      issue: 'Smooth',
      dueOn: '2026-09-01',
    });
    service.remove(job.id);
    expect(() => service.findOne(job.id)).toThrow(NotFoundError);
  });
});
