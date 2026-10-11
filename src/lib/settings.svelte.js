// Visible day range and grid style. Stored in localStorage next to the events
// and carried in Export / Import.
const KEY = 'myweek.settings.v1'
export const DEFAULTS = { dayStart: 7, dayEnd: 17, gridStyle: 'auto' }
export const PRESETS = [['Short', 7, 17], ['Long', 7, 22]]
export const MIN_SPAN = 4 // hours

export function normalizeSettings(s) {
  if (!s || typeof s !== 'object') return null
  const { dayStart, dayEnd } = s
  const gridStyle = s.gridStyle ?? 'auto'
  const ok = Number.isInteger(dayStart) && Number.isInteger(dayEnd) && dayStart >= 0 && dayEnd <= 24 &&
    dayEnd - dayStart >= MIN_SPAN && ['auto', 'hourly', 'hybrid'].includes(gridStyle)
  return ok ? { dayStart, dayEnd, gridStyle } : null
}

function load() {
  try { return normalizeSettings(JSON.parse(localStorage.getItem(KEY))) ?? { ...DEFAULTS } } catch { return { ...DEFAULTS } }
}

export const settings = $state(load())

export const applySettings = (s) => Object.assign(settings, s)
export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true } catch { return false }
}

// 'auto' picks hourly for days of 12 hours or less, hybrid for longer ones.
export const gridMode = () =>
  settings.gridStyle === 'auto' ? (settings.dayEnd - settings.dayStart > 12 ? 'hybrid' : 'hourly') : settings.gridStyle
