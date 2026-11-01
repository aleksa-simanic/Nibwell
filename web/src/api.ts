import type { Grind, NibSize, PenJob, PenStatus } from './types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = (await response.json()) as { message?: string | string[] }
      if (Array.isArray(body.message)) {
        detail = body.message.join(', ')
      } else if (body.message) {
        detail = body.message
      }
    } catch {
      // keep default detail
    }
    throw new Error(detail)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const api = {
  listJobs: (params?: {
    status?: PenStatus
    grind?: Grind
    tag?: string
    q?: string
  }) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.grind) query.set('grind', params.grind)
    if (params?.tag) query.set('tag', params.tag)
    if (params?.q) query.set('q', params.q)
    const suffix = query.toString() ? `?${query}` : ''
    return request<PenJob[]>(`/api/jobs${suffix}`)
  },
  createJob: (payload: {
    code: string
    customer: string
    penBrand: string
    nibSize: NibSize
    grind: Grind
    issue: string
    dueOn: string
    notes?: string
    tags?: string[]
  }) =>
    request<PenJob>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  removeJob: (id: string) =>
    request<void>(`/api/jobs/${id}`, { method: 'DELETE' }),
  advance: (id: string) =>
    request<PenJob>(`/api/jobs/${id}/advance`, { method: 'POST' }),
}
