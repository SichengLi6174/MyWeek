import { weekday, DAY_FULL } from './dates.js'

// Does the series (ignoring overrides) have an occurrence on `date`?
const occursOn = (ev, date) => {
  if (date < ev.date || (ev.until && date > ev.until)) return false
  if (ev.repeat === 'daily') return true
  if (ev.repeat === 'weekdays') return weekday(date) < 5
  if (ev.repeat === 'weekly') return weekday(date) === weekday(ev.date)
  return date === ev.date
}

// Expand stored rules into concrete occurrences landing in `dates` (one week).
export function expand(events, dates) {
  const first = dates[0]
  const last = dates[dates.length - 1]
  const out = []
  for (const ev of events) {
    const candidates = new Set(dates)
    for (const k of Object.keys(ev.overrides ?? {})) candidates.add(k)
    for (const orig of candidates) {
      if (!occursOn(ev, orig)) continue
      const o = ev.overrides?.[orig]
      if (o === 'deleted') continue
      const occ = { ...ev, ...(o ?? {}) }
      const date = occ.date = o?.date ?? orig
      if (date < first || date > last) continue
      out.push({
        key: `${ev.id}@${orig}`, eventId: ev.id, origDate: orig, date,
        startMin: occ.startMin, endMin: occ.endMin, title: occ.title,
        colour: occ.colour, notes: occ.notes ?? '', repeat: ev.repeat,
      })
    }
  }
  return out
}

// Overlapping occurrences share the column width. Transitively overlapping
// events form a group; each gets a column and the group's column count.
export function layoutDay(occs) {
  const sorted = [...occs].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin)
  const result = []
  let group = []
  let groupEnd = -1
  const flush = () => {
    const cols = []
    const placed = group.map((o) => {
      let c = cols.findIndex((end) => end <= o.startMin)
      if (c === -1) c = cols.length
      cols[c] = o.endMin
      return { ...o, col: c }
    })
    for (const p of placed) result.push({ ...p, cols: cols.length })
    group = []
  }
  for (const o of sorted) {
    if (group.length && o.startMin >= groupEnd) flush()
    group.push(o)
    groupEnd = Math.max(groupEnd, o.endMin)
  }
  if (group.length) flush()
  return result
}

const KEY = 'myweek.v1'
export function loadEvents(fallback) {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return fallback
}
export function saveEvents(events) {
  try { localStorage.setItem(KEY, JSON.stringify(events)); return true } catch { return false }
}

// ---- backup file ----
export const exportJSON = (events) =>
  JSON.stringify({ app: 'myweek', version: 1, exportedAt: new Date().toISOString(), events }, null, 2)

const COLOURS = ['high', 'medium', 'low', 'personal']
const REPEATS = ['none', 'daily', 'weekly', 'weekdays']
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const isMin = (v) => Number.isInteger(v) && v >= 0 && v <= 1440

// Accepts the exported object or a bare array. Returns { events } or { error }.
export function parseImport(text) {
  let data
  try { data = JSON.parse(text) } catch { return { error: "That file isn't valid JSON." } }
  const list = Array.isArray(data) ? data : data?.events
  if (!Array.isArray(list)) return { error: "That file doesn't look like a My Week backup." }
  const events = []
  for (const [i, e] of list.entries()) {
    const ok = e && typeof e === 'object' && typeof e.id === 'string' && isDate(e.date) && isMin(e.startMin) &&
      isMin(e.endMin) && e.startMin < e.endMin && typeof e.title === 'string' &&
      COLOURS.includes(e.colour) && REPEATS.includes(e.repeat) && (e.until === undefined || isDate(e.until))
    if (!ok) return { error: `Event ${i + 1} in the file is invalid, nothing was imported.` }
    events.push({
      id: e.id, date: e.date, startMin: e.startMin, endMin: e.endMin, title: e.title, colour: e.colour,
      repeat: e.repeat, notes: typeof e.notes === 'string' ? e.notes : '',
      ...(e.until ? { until: e.until } : {}),
      overrides: e.overrides && typeof e.overrides === 'object' ? e.overrides : {},
    })
  }
  return { events }
}

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const repeatLabel = (repeat, date) => ({
  none: 'Does not repeat',
  daily: 'Daily',
  weekly: `Weekly on ${DAY_FULL[weekday(date)]}`,
  weekdays: 'Every weekday (Mon–Fri)',
})[repeat]
