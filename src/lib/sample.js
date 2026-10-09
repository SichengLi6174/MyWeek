// Temporary seed data (week of 2026-10-05) used until persistence lands in step 2.
const e = (id, date, s, en, title, colour, repeat = 'none') => ({
  id, date, startMin: s * 60, endMin: en * 60, title, colour, repeat, overrides: {},
})
const days = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']

export const sampleEvents = [
  ...days.map((d, i) => e(`mr${i}`, d, 7.5, 8, 'Morning review', 'low', 'weekly')),
  e('a', '2026-10-05', 9, 11, 'Deep work', 'medium'),
  e('b', '2026-10-05', 13, 14, 'LeetCode · graphs', 'low'),
  e('c', '2026-10-06', 10, 11.5, 'Interview · founding eng', 'high'),
  e('d', '2026-10-06', 14, 16, 'Side project build', 'personal'),
  e('e', '2026-10-07', 9, 10, 'Weekly planning', 'medium', 'weekly'),
  e('f', '2026-10-07', 11, 12.5, 'Gym', 'personal'),
  e('g', '2026-10-07', 14.5, 16.5, 'Take-home task', 'high'),
  e('h', '2026-10-08', 9.5, 11, 'System design study', 'low'),
  e('i', '2026-10-08', 13, 14.5, 'Coffee chat', 'medium'),
  e('j', '2026-10-09', 10, 12, 'Deep work', 'medium'),
  e('k', '2026-10-09', 14, 15, 'Weekly review', 'low', 'weekly'),
  e('l', '2026-10-10', 10, 12.5, 'Climbing', 'personal'),
  e('m', '2026-10-11', 11, 12, 'Call home', 'personal'),
]
