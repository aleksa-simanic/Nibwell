export type PenStatus =
  | 'quoted'
  | 'grinding'
  | 'tuning'
  | 'writing_test'
  | 'ready'
  | 'picked_up'

export type NibSize = 'ef' | 'f' | 'm' | 'b' | 'stub'
export type Grind = 'stock' | 'architect' | 'italic' | 'needlepoint'

export interface PenJob {
  id: string
  code: string
  customer: string
  penBrand: string
  nibSize: NibSize
  grind: Grind
  issue: string
  dueOn: string
  status: PenStatus
  notes: string
  tags: string[]
  createdAt: string
  updatedAt: string
}
