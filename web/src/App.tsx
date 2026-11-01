import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from './api'
import type { Grind, NibSize, PenJob, PenStatus } from './types'

const STATUSES: PenStatus[] = [
  'quoted',
  'grinding',
  'tuning',
  'writing_test',
  'ready',
  'picked_up',
]

const NIB_SIZES: NibSize[] = ['ef', 'f', 'm', 'b', 'stub']
const GRINDS: Grind[] = ['stock', 'architect', 'italic', 'needlepoint']

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

function statusLabel(status: PenStatus): string {
  return status.replace('_', ' ')
}

export default function App() {
  const [jobs, setJobs] = useState<PenJob[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [statusFilter, setStatusFilter] = useState<PenStatus | ''>('')
  const [query, setQuery] = useState('')

  const [code, setCode] = useState('')
  const [customer, setCustomer] = useState('')
  const [penBrand, setPenBrand] = useState('')
  const [nibSize, setNibSize] = useState<NibSize>('m')
  const [grind, setGrind] = useState<Grind>('architect')
  const [issue, setIssue] = useState('')
  const [dueOn, setDueOn] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')

  const selected = useMemo(
    () => jobs.find((job) => job.id === selectedId) ?? null,
    [jobs, selectedId],
  )

  async function refreshList(preferId?: string) {
    const list = await api.listJobs({
      status: statusFilter || undefined,
      q: query.trim() || undefined,
    })
    setJobs(list)
    const nextId =
      preferId && list.some((job) => job.id === preferId)
        ? preferId
        : (list[0]?.id ?? null)
    setSelectedId(nextId)
    return nextId
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        await refreshList()
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [statusFilter])

  async function runAction(action: () => Promise<void>) {
    try {
      setBusy(true)
      setError(null)
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  async function onSearch(event: FormEvent) {
    event.preventDefault()
    await runAction(async () => {
      await refreshList(selectedId ?? undefined)
    })
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    await runAction(async () => {
      const job = await api.createJob({
        code,
        customer,
        penBrand,
        nibSize,
        grind,
        issue,
        dueOn,
        notes: notes || undefined,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      })
      setCode('')
      setCustomer('')
      setPenBrand('')
      setIssue('')
      setNotes('')
      setTags('')
      await refreshList(job.id)
    })
  }

  async function onAdvance() {
    if (!selected) return
    await runAction(async () => {
      await api.advance(selected.id)
      await refreshList(selected.id)
    })
  }

  async function onRemove() {
    if (!selected) return
    await runAction(async () => {
      await api.removeJob(selected.id)
      await refreshList()
    })
  }

  return (
    <div className="page">
      <div className="atmosphere" aria-hidden="true" />

      <header className="hero">
        <p className="brand">Nibwell</p>
        <h1>Bench board for nibs in progress</h1>
        <p className="lede">
          Quote, grind, tune, and hand off fountain pens — one writing test at a
          time.
        </p>
        <a className="cta" href="#board">
          Open the board
        </a>
      </header>

      <main id="board" className="board">
        <div className="board-bar">
          <h2>Nib jobs</h2>
          <form className="filters" onSubmit={onSearch}>
            <label>
              Status
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter((e.target.value || '') as PenStatus | '')
                }
              >
                <option value="">All</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grow">
              Search
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Code, customer, pen…"
              />
            </label>
            <button type="submit" disabled={busy}>
              Apply
            </button>
          </form>
        </div>

        {error ? <p className="banner error">{error}</p> : null}
        {loading ? <p className="banner">Loading jobs…</p> : null}

        <div className="layout">
          <section className="rail" aria-label="Job list">
            {jobs.length === 0 && !loading ? (
              <p className="empty">No jobs match these filters.</p>
            ) : (
              <ul className="job-list">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <button
                      type="button"
                      className={
                        job.id === selectedId ? 'job-item active' : 'job-item'
                      }
                      onClick={() => setSelectedId(job.id)}
                    >
                      <span className="job-code">{job.code}</span>
                      <span className="job-title">{job.penBrand}</span>
                      <span className={`pill status-${job.status}`}>
                        {statusLabel(job.status)}
                      </span>
                      <span className="job-meta">
                        Due {formatDate(job.dueOn)} · {job.nibSize.toUpperCase()}{' '}
                        {job.grind}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="detail" aria-label="Job detail">
            {selected ? (
              <>
                <div className="detail-head">
                  <div>
                    <p className="eyebrow">{selected.code}</p>
                    <h3>{selected.penBrand}</h3>
                    <p className="muted">{selected.customer}</p>
                  </div>
                  <span className={`pill status-${selected.status}`}>
                    {statusLabel(selected.status)}
                  </span>
                </div>

                <dl className="facts">
                  <div>
                    <dt>Nib</dt>
                    <dd>{selected.nibSize.toUpperCase()}</dd>
                  </div>
                  <div>
                    <dt>Grind</dt>
                    <dd>{selected.grind}</dd>
                  </div>
                  <div>
                    <dt>Issue</dt>
                    <dd>{selected.issue}</dd>
                  </div>
                  <div>
                    <dt>Due</dt>
                    <dd>{formatDate(selected.dueOn)}</dd>
                  </div>
                  <div>
                    <dt>Tags</dt>
                    <dd>
                      {selected.tags.length ? selected.tags.join(', ') : '—'}
                    </dd>
                  </div>
                </dl>

                {selected.notes ? (
                  <p className="notes">{selected.notes}</p>
                ) : null}

                <div className="actions">
                  <button
                    type="button"
                    onClick={onAdvance}
                    disabled={busy || selected.status === 'picked_up'}
                  >
                    Advance status
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={onRemove}
                    disabled={busy}
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <p className="empty">Select a job to see the ticket.</p>
            )}
          </section>

          <section className="compose" aria-label="New job">
            <h3>New nib job</h3>
            <form className="form" onSubmit={onCreate}>
              <label>
                Code
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="NW-210"
                />
              </label>
              <label>
                Customer
                <input
                  required
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </label>
              <label>
                Pen
                <input
                  required
                  value={penBrand}
                  onChange={(e) => setPenBrand(e.target.value)}
                  placeholder="Pilot Custom 823"
                />
              </label>
              <div className="row">
                <label>
                  Nib
                  <select
                    value={nibSize}
                    onChange={(e) => setNibSize(e.target.value as NibSize)}
                  >
                    {NIB_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Grind
                  <select
                    value={grind}
                    onChange={(e) => setGrind(e.target.value as Grind)}
                  >
                    {GRINDS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Issue
                <input
                  required
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="Architect grind for notes"
                />
              </label>
              <label>
                Due on
                <input
                  type="date"
                  required
                  value={dueOn}
                  onChange={(e) => setDueOn(e.target.value)}
                />
              </label>
              <label>
                Tags
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="architect, rush"
                />
              </label>
              <label>
                Notes
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <button type="submit" disabled={busy}>
                Add to board
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}
