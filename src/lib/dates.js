// Plain "YYYY-MM-DD" strings and minutes-since-midnight; no timezone maths.
const pad = (n) => String(n).padStart(2, '0')

export const START_HOUR = 7
export const END_HOUR = 17
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3))

export const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d }
}
// Dates are built at UTC noon so DST can never shift the day.
const toUTC = (s) => {
  const { y, m, d } = parseDate(s)
  return new Date(Date.UTC(y, m - 1, d, 12))
}
const fromUTC = (dt) => `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`

export const todayStr = () => {
  const n = new Date()
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`
}
export const nowMin = () => {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}
export const addDays = (s, n) => {
  const dt = toUTC(s)
  dt.setUTCDate(dt.getUTCDate() + n)
  return fromUTC(dt)
}
export const weekday = (s) => (toUTC(s).getUTCDay() + 6) % 7 // Mon = 0
export const weekStart = (s) => addDays(s, -weekday(s))
export const weekDates = (s) => Array.from({ length: 7 }, (_, i) => addDays(weekStart(s), i))

// ISO 8601 week number
export const isoWeek = (s) => {
  const dt = toUTC(s)
  dt.setUTCDate(dt.getUTCDate() + 3 - weekday(s))
  const jan4 = Date.UTC(dt.getUTCFullYear(), 0, 4, 12)
  return 1 + Math.round(((dt - jan4) / 864e5 - 3 + ((new Date(jan4).getUTCDay() + 6) % 7)) / 7)
}

export const fmtTime = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`

export const monthYear = (s) => {
  const { y, m } = parseDate(s)
  return `${MONTHS[m - 1]} ${y}`
}
export const weekRange = (ws) => {
  const a = parseDate(ws)
  const b = parseDate(addDays(ws, 6))
  return a.m === b.m
    ? `${a.d}–${b.d} ${MONTHS_SHORT[a.m - 1]}`
    : `${a.d} ${MONTHS_SHORT[a.m - 1]} – ${b.d} ${MONTHS_SHORT[b.m - 1]}`
}

export const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const daysBetween = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 864e5)
export const fmtShortDate = (s) => {
  const { m, d } = parseDate(s)
  return `${DAY_NAMES[weekday(s)]} ${d} ${MONTHS_SHORT[m - 1]}`
}
export const fmtLongDate = (s) => {
  const { m, d } = parseDate(s)
  return `${DAY_FULL[weekday(s)]}, ${d} ${MONTHS[m - 1]}`
}
export const fmtDuration = (min) => {
  const h = Math.floor(min / 60), m = min % 60
  return h ? (m ? `${h} hr ${m} min` : `${h} hr`) : `${m} min`
}
