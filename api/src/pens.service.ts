import { randomUUID } from 'crypto';
import { ConflictError, NotFoundError, AppError } from './errors';
import type {
  CreatePenInput,
  ListFilters,
  PenJob,
  PenStatus,
  UpdatePenInput,
} from './types';
import { STATUS_FLOW } from './types';

function normalizeTags(tags?: string[]): string[] {
  if (!tags?.length) {
    return [];
  }
  const cleaned = new Set<string>();
  for (const tag of tags) {
    const value = tag.trim().toLowerCase();
    if (value) {
      cleaned.add(value);
    }
  }
  return [...cleaned];
}

export class PensService {
  private readonly jobs = new Map<string, PenJob>();

  constructor() {
    this.seed();
  }

  findAll(filters: ListFilters = {}): PenJob[] {
    let items = [...this.jobs.values()];

    if (filters.status) {
      items = items.filter((job) => job.status === filters.status);
    }
    if (filters.grind) {
      items = items.filter((job) => job.grind === filters.grind);
    }
    if (filters.tag?.trim()) {
      const tag = filters.tag.trim().toLowerCase();
      items = items.filter((job) => job.tags.includes(tag));
    }
    if (filters.q?.trim()) {
      const needle = filters.q.trim().toLowerCase();
      items = items.filter(
        (job) =>
          job.code.toLowerCase().includes(needle) ||
          job.customer.toLowerCase().includes(needle) ||
          job.penBrand.toLowerCase().includes(needle) ||
          job.issue.toLowerCase().includes(needle) ||
          job.notes.toLowerCase().includes(needle),
      );
    }

    return items.sort(
      (a, b) => a.dueOn.localeCompare(b.dueOn) || a.code.localeCompare(b.code),
    );
  }

  findOne(id: string): PenJob {
    const job = this.jobs.get(id);
    if (!job) {
      throw new NotFoundError(`Job ${id} not found`);
    }
    return job;
  }

  create(input: CreatePenInput): PenJob {
    const code = input.code.trim().toUpperCase();
    this.ensureUniqueCode(code);

    const now = new Date().toISOString();
    const job: PenJob = {
      id: randomUUID(),
      code,
      customer: input.customer.trim(),
      penBrand: input.penBrand.trim(),
      nibSize: input.nibSize,
      grind: input.grind,
      issue: input.issue.trim(),
      dueOn: input.dueOn.slice(0, 10),
      status: input.status ?? 'quoted',
      notes: (input.notes ?? '').trim(),
      tags: normalizeTags(input.tags),
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  update(id: string, input: UpdatePenInput): PenJob {
    const existing = this.findOne(id);
    const code = input.code ? input.code.trim().toUpperCase() : existing.code;
    if (code !== existing.code) {
      this.ensureUniqueCode(code, id);
    }

    const updated: PenJob = {
      ...existing,
      code,
      customer: input.customer?.trim() ?? existing.customer,
      penBrand: input.penBrand?.trim() ?? existing.penBrand,
      nibSize: input.nibSize ?? existing.nibSize,
      grind: input.grind ?? existing.grind,
      issue: input.issue?.trim() ?? existing.issue,
      dueOn: input.dueOn ? input.dueOn.slice(0, 10) : existing.dueOn,
      status: input.status ?? existing.status,
      notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
      tags: input.tags !== undefined ? normalizeTags(input.tags) : existing.tags,
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.jobs.delete(id)) {
      throw new NotFoundError(`Job ${id} not found`);
    }
  }

  advance(id: string): PenJob {
    const job = this.findOne(id);
    const next = STATUS_FLOW[job.status];
    if (!next) {
      throw new AppError(`Job is already ${job.status}`);
    }
    return this.update(id, { status: next });
  }

  grind(id: string): PenJob {
    return this.transition(id, 'quoted', 'grinding');
  }

  tune(id: string): PenJob {
    return this.transition(id, 'grinding', 'tuning');
  }

  writingTest(id: string): PenJob {
    return this.transition(id, 'tuning', 'writing_test');
  }

  markReady(id: string): PenJob {
    return this.transition(id, 'writing_test', 'ready');
  }

  pickup(id: string): PenJob {
    return this.transition(id, 'ready', 'picked_up');
  }

  clear(): void {
    this.jobs.clear();
  }

  private transition(id: string, from: PenStatus, to: PenStatus): PenJob {
    const job = this.findOne(id);
    if (job.status !== from) {
      throw new AppError(`Job must be ${from} before moving to ${to}`);
    }
    return this.update(id, { status: to });
  }

  private ensureUniqueCode(code: string, exceptId?: string): void {
    for (const job of this.jobs.values()) {
      if (job.code === code && job.id !== exceptId) {
        throw new ConflictError(`Job code '${code}' already exists`);
      }
    }
  }

  private seed(): void {
    this.create({
      code: 'NW-101',
      customer: 'Nora Ellis',
      penBrand: 'Pilot Custom 823',
      nibSize: 'm',
      grind: 'architect',
      issue: 'Broaden the downstroke, keep the hairline.',
      dueOn: '2026-08-22',
      status: 'tuning',
      notes: 'Bring the ink she likes for the writing test.',
      tags: ['architect', 'rush'],
    });
    this.create({
      code: 'NW-102',
      customer: 'Harbor Press',
      penBrand: 'Lamy 2000',
      nibSize: 'f',
      grind: 'italic',
      issue: 'Crisp italic for captions.',
      dueOn: '2026-08-28',
      status: 'quoted',
      notes: 'Studio loaner; keep the original feed.',
      tags: ['studio'],
    });
    this.create({
      code: 'NW-103',
      customer: 'Sam Ortega',
      penBrand: 'Sailor Pro Gear',
      nibSize: 'ef',
      grind: 'needlepoint',
      issue: 'Needlepoint for notation.',
      dueOn: '2026-08-18',
      status: 'ready',
      notes: 'Writing test passed on Tomoe River.',
      tags: ['notation'],
    });
  }
}
