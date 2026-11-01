export const NIB_SIZES = ['ef', 'f', 'm', 'b', 'stub'] as const;
export type NibSize = (typeof NIB_SIZES)[number];

export const GRINDS = ['stock', 'architect', 'italic', 'needlepoint'] as const;
export type Grind = (typeof GRINDS)[number];

export const STATUSES = [
  'quoted',
  'grinding',
  'tuning',
  'writing_test',
  'ready',
  'picked_up',
] as const;
export type PenStatus = (typeof STATUSES)[number];

export const STATUS_FLOW: Record<PenStatus, PenStatus | null> = {
  quoted: 'grinding',
  grinding: 'tuning',
  tuning: 'writing_test',
  writing_test: 'ready',
  ready: 'picked_up',
  picked_up: null,
};

export interface PenJob {
  id: string;
  code: string;
  customer: string;
  penBrand: string;
  nibSize: NibSize;
  grind: Grind;
  issue: string;
  dueOn: string;
  status: PenStatus;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePenInput {
  code: string;
  customer: string;
  penBrand: string;
  nibSize: NibSize;
  grind: Grind;
  issue: string;
  dueOn: string;
  status?: PenStatus;
  notes?: string;
  tags?: string[];
}

export interface UpdatePenInput {
  code?: string;
  customer?: string;
  penBrand?: string;
  nibSize?: NibSize;
  grind?: Grind;
  issue?: string;
  dueOn?: string;
  status?: PenStatus;
  notes?: string;
  tags?: string[];
}

export interface ListFilters {
  status?: PenStatus;
  grind?: Grind;
  tag?: string;
  q?: string;
}
