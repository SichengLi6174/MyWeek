<script>
  import Header from './lib/Header.svelte'
  import WeekGrid from './lib/WeekGrid.svelte'
  import Popover from './lib/Popover.svelte'
  import EventForm from './lib/EventForm.svelte'
  import EventDetails from './lib/EventDetails.svelte'
  import RecurringDialog from './lib/RecurringDialog.svelte'
  import { todayStr, weekStart, addDays, weekDates, nowMin, daysBetween, fmtTime, fmtShortDate } from './lib/dates.js'
  import { sampleEvents } from './lib/sample.js'
  import { loadEvents, saveEvents, expand, newId, exportJSON, parseImport } from './lib/events.js'

  let today = $state(todayStr())
  let anchor = $state(weekStart(todayStr()))
  let events = $state(loadEvents(sampleEvents))

  let toast = $state(null) // { text, kind }
  let toastTimer
  function say(text, kind = 'ok', ms = 3500) {
    toast = { text, kind }
    clearTimeout(toastTimer)
    if (ms) toastTimer = setTimeout(() => (toast = null), ms)
  }

  let warned = false
  $effect(() => {
    if (!saveEvents($state.snapshot(events)) && !warned) {
      warned = true
      say("This browser won't let My Week save. Use Export JSON to keep a backup.", 'error', 0)
    }
  })

  // Keep "today" right if the page stays open past midnight.
  $effect(() => {
    const t = setInterval(() => {
      const n = todayStr()
      if (n === today) return
      if (anchor === weekStart(today)) anchor = weekStart(n)
      today = n
    }, 60000)
    return () => clearInterval(t)
  })

  function exportData() {
    const blob = new Blob([exportJSON($state.snapshot(events))], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `myweek-${todayStr()}.json`
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    say(`Exported ${events.length} event${events.length === 1 ? '' : 's'}.`)
  }
  async function importData(file) {
    const r = parseImport(await file.text())
    if (r.error) return say(r.error, 'error', 6000)
    if (events.length && !confirm(`Replace your ${events.length} current events with the ${r.events.length} in "${file.name}"?`)) return
    close()
    events = r.events
    say(`Imported ${r.events.length} event${r.events.length === 1 ? '' : 's'}.`)
  }

  // t = today, ← / → = previous / next week
  function onkey(e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || pop || pending) return
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return
    if (e.key === 't' || e.key === 'T') anchor = weekStart(today)
    else if (e.key === 'ArrowLeft') anchor = addDays(anchor, -7)
    else if (e.key === 'ArrowRight') anchor = addDays(anchor, 7)
    else return
    e.preventDefault()
  }

  // Popover state. draft = unsaved placeholder; pop = which popover is open.
  let draft = $state(null)
  let pop = $state(null) // { kind: 'create' | 'details' | 'edit', occ? }

  const close = () => { draft = null; pop = null }

  const find = (id) => events.find((e) => e.id === id)
  const FIELDS = ['date', 'startMin', 'endMin', 'title', 'colour', 'notes']
  const pick = (o) => Object.fromEntries(FIELDS.map((k) => [k, o[k]]))
  const snap = (v) => $state.snapshot(v)

  // ---- edits ----
  // Edits to a recurring event are held in `pending` until the dialog picks a scope.
  let pending = $state(null) // { type, occ, patch, repeatChanged, subtitle, after }

  function describe(occ, patch, changed) {
    const parts = []
    const timeChanged = changed.includes('startMin') || changed.includes('endMin')
    const range = `${fmtTime(patch.startMin ?? occ.startMin)} – ${fmtTime(patch.endMin ?? occ.endMin)}`
    if (changed.includes('date')) parts.push(`moved to ${fmtShortDate(patch.date)}, ${range}`)
    else if (timeChanged) parts.push(`moved to ${range}`)
    if (changed.includes('title')) parts.push(`renamed to ${patch.title}`)
    if (changed.includes('colour')) parts.push(`colour set to ${patch.colour}`)
    if (changed.includes('notes')) parts.push('notes updated')
    if (patch.repeat !== undefined && patch.repeat !== occ.repeat) parts.push('repeat changed')
    return parts.length > 1 ? `${occ.title}: ${parts.join(', ')}` : `${occ.title} ${parts[0] ?? 'updated'}`
  }

  // after: 'close' (form / drag) or 'keep' (details popover stays open)
  function requestEdit(occ, patch, after = 'close') {
    const ev = find(occ.eventId)
    if (!ev) return
    const changed = FIELDS.filter((k) => k in patch && patch[k] !== occ[k])
    const repeatChanged = patch.repeat !== undefined && patch.repeat !== ev.repeat
    if (!changed.length && !repeatChanged) { if (after === 'close') close(); return }
    if (ev.repeat === 'none') { commitEdit(occ, patch, 'all'); if (after === 'close') close(); return }
    pending = { type: 'edit', occ, patch, repeatChanged, after, subtitle: describe(occ, patch, changed) }
  }

  // Apply a change to a whole series record (used for "all" and, on a clone, "following").
  function applySeries(s, occ, patch, changed, repeatChanged) {
    const has = (k) => changed.includes(k)
    if (has('startMin')) s.startMin += patch.startMin - occ.startMin
    if (has('endMin')) s.endMin += patch.endMin - occ.endMin
    for (const k of ['title', 'colour', 'notes']) if (has(k)) s[k] = patch[k]
    let dd = 0
    if (has('date') && s.repeat === 'weekly') {
      dd = daysBetween(occ.date, patch.date)
      s.date = addDays(s.date, dd)
    }
    const next = {}
    for (const [k, o] of Object.entries(s.overrides)) {
      const nk = dd ? addDays(k, dd) : k
      if (o === 'deleted') { next[nk] = o; continue }
      const o2 = { ...o }
      for (const f of changed) delete o2[f] // the series edit replaces those exceptions
      if (Object.keys(o2).length) next[nk] = o2
    }
    s.overrides = repeatChanged ? {} : next
    if (repeatChanged) s.repeat = patch.repeat
  }

  // Returns the id of the series now holding the occurrence.
  function commitEdit(occ, patch, scope) {
    let ev = find(occ.eventId)
    if (!ev) return
    const changed = FIELDS.filter((k) => k in patch && patch[k] !== occ[k])
    const repeatChanged = patch.repeat !== undefined && patch.repeat !== ev.repeat
    if (ev.repeat === 'none') {
      for (const k of changed) ev[k] = patch[k]
      if (repeatChanged) { ev.repeat = patch.repeat; ev.overrides = {} }
      return ev.id
    }
    if (scope === 'this') {
      const o = ev.overrides[occ.origDate]
      ev.overrides[occ.origDate] = { ...(o && o !== 'deleted' ? o : {}), ...Object.fromEntries(changed.map((k) => [k, patch[k]])) }
      return ev.id
    }
    if (scope === 'following' && occ.origDate > ev.date) {
      const clone = { ...snap(ev), id: newId(), date: occ.origDate, overrides: {} }
      const keep = {}
      for (const [k, v] of Object.entries(snap(ev.overrides))) (k >= occ.origDate ? clone.overrides : keep)[k] = v
      ev.overrides = keep
      ev.until = addDays(occ.origDate, -1)
      events.push(clone)
      ev = events[events.length - 1]
    }
    applySeries(ev, occ, patch, changed, repeatChanged)
    return ev.id
  }

  // ---- deletes ----
  function requestDelete(occ) {
    const ev = find(occ.eventId)
    if (!ev) return
    if (ev.repeat === 'none') { commitDelete(occ, 'all'); close(); return }
    pending = { type: 'delete', occ, after: 'close', subtitle: occ.title }
  }
  function commitDelete(occ, scope) {
    const ev = find(occ.eventId)
    if (!ev) return
    if (ev.repeat !== 'none' && scope === 'this') ev.overrides[occ.origDate] = 'deleted'
    else if (ev.repeat !== 'none' && scope === 'following' && occ.origDate > ev.date) {
      ev.until = addDays(occ.origDate, -1)
      for (const k of Object.keys(ev.overrides)) if (k >= occ.origDate) delete ev.overrides[k]
    } else events.splice(events.indexOf(ev), 1)
  }

  function resolvePending(scope) {
    const p = pending
    pending = null
    if (p.type === 'delete') { commitDelete(p.occ, scope); close(); return }
    const id = commitEdit(p.occ, p.patch, scope)
    if (p.after === 'close') close()
    else if (pop?.occ) pop = { ...pop, occ: { ...pop.occ, eventId: id, key: `${id}@${pop.occ.origDate}` } }
  }
  // While the dialog is up the popover underneath must not react to outside clicks.
  const closePop = () => { if (!pending) close() }

  const moveOcc = (occ, c) => requestEdit(occ, c)
  // Dashed original slot + moved card shown behind the dialog.
  const preview = $derived.by(() => {
    const p = pending
    if (p?.type !== 'edit') return null
    const { occ, patch } = p
    const to = { date: patch.date ?? occ.date, startMin: patch.startMin ?? occ.startMin, endMin: patch.endMin ?? occ.endMin }
    if (to.date === occ.date && to.startMin === occ.startMin && to.endMin === occ.endMin) return null
    return { key: occ.key, from: { date: occ.date, startMin: occ.startMin, endMin: occ.endMin }, to,
      colour: patch.colour ?? occ.colour, title: patch.title || occ.title }
  })

  function save(f) {
    if (pop.kind === 'create') {
      events.push({ id: newId(), ...pick(f), title: f.title.trim() || '(No title)', repeat: f.repeat, overrides: {} })
      anchor = weekStart(f.date)
      close()
    } else {
      requestEdit(current, { ...pick(f), title: f.title.trim() || '(No title)', repeat: f.repeat })
    }
  }

  function open(occ) {
    draft = null
    pop = { kind: 'details', occ }
  }
  // Re-read the occurrence from the data so the popover reflects changes.
  const current = $derived.by(() => {
    if (pop?.kind === 'create' || !pop) return null
    return expand(events, weekDates(pop.occ.date)).find((o) => o.key === pop.occ.key) ?? null
  })
  $effect(() => { if (pop && pop.kind !== 'create' && !current) close() })

  function duplicate() {
    const c = current
    const id = newId()
    events.push({ id, ...pick(c), repeat: 'none', overrides: {} })
    pop = { kind: 'details', occ: { ...c, key: `${id}@${c.date}`, eventId: id, origDate: c.date } }
  }
  const recolour = (colour) => requestEdit(current, { colour }, 'keep')

  function newEvent() {
    const d = weekDates(anchor).includes(today) ? today : anchor
    const h = Math.min(16, Math.max(7, Math.ceil(nowMin() / 60)))
    const startMin = d === today ? h * 60 : 9 * 60
    draft = { date: d, startMin, endMin: startMin + 60, title: '', colour: 'medium', repeat: 'none', notes: '' }
    pop = { kind: 'create' }
  }

  const sweeping = (d) => { if (d && pop) pop = null; draft = d }
  const sweepEnd = () => { if (draft) pop = { kind: 'create' } }
  const selectedKey = $derived(current && pop?.kind !== 'create' ? current.key : null)
</script>

<svelte:window onkeydown={onkey} />

<div class="app">
  <div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
  <Header
    {anchor}
    onprev={() => (anchor = addDays(anchor, -7))}
    onnext={() => (anchor = addDays(anchor, 7))}
    ontoday={() => (anchor = weekStart(today))}
    onnew={newEvent}
    onexport={exportData}
    onimport={importData}
  />
  <WeekGrid {anchor} {today} {events} {draft} {selectedKey} {preview} onsweep={sweeping} onsweepend={sweepEnd} onopen={open} onmoveend={moveOcc} />

  {#if pop?.kind === 'create' && draft}
    <Popover anchorKey="draft" label="New event" onclose={closePop}>
      <EventForm initial={draft} onlive={(f) => (draft = f)} onsave={save} onclose={close} />
    </Popover>
  {:else if pop?.kind === 'edit' && current}
    {#key current.key}
      <Popover anchorKey={current.key} label="Edit event" onclose={closePop}>
        <EventForm initial={current} onsave={save} onclose={close} />
      </Popover>
    {/key}
  {:else if pop?.kind === 'details' && current}
    <Popover anchorKey={current.key} width={384} label="Event details" onclose={closePop}>
      <EventDetails occ={current} onclose={close} ondelete={() => requestDelete(current)} onduplicate={duplicate} oncolour={recolour}
        onedit={() => (pop = { kind: 'edit', occ: pop.occ })} />
    </Popover>
  {/if}

  {#if toast}
    <div class="toast {toast.kind}" role="status">
      {toast.text}
      {#if toast.kind === 'error'}<button aria-label="Dismiss" onclick={() => (toast = null)}>✕</button>{/if}
    </div>
  {/if}

  {#if pending}
    <RecurringDialog type={pending.type} subtitle={pending.subtitle} repeatChanged={pending.repeatChanged}
      onok={resolvePending} oncancel={() => (pending = null)} />
  {/if}
</div>

<style>
  .app {
    position: relative; height: 100%; overflow: hidden; padding: 24px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .toast {
    position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 70; max-width: min(560px, calc(100vw - 24px));
    display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-radius: 22px; font-size: 14px;
    background: linear-gradient(180deg, rgba(44,50,74,.92), rgba(22,26,42,.95)); border: 1px solid rgba(255,255,255,.18);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.28), 0 20px 50px rgba(0,0,0,.5);
    backdrop-filter: blur(30px) saturate(180%); -webkit-backdrop-filter: blur(30px) saturate(180%);
  }
  .toast.error { border-color: rgba(255,99,88,.6); }
  .toast button { border: 0; background: transparent; width: 32px; height: 32px; border-radius: 16px; opacity: .7; }
  .blob { position: absolute; border-radius: 50%; pointer-events: none; }
  .b1 { left: -120px; top: -160px; width: 620px; height: 620px; background: radial-gradient(circle, rgba(120,92,255,.55), rgba(120,92,255,0) 70%); }
  .b2 { right: -140px; bottom: -200px; width: 720px; height: 720px; background: radial-gradient(circle, rgba(32,190,190,.45), rgba(32,190,190,0) 70%); }
  .b3 { left: 44%; top: 42%; width: 420px; height: 420px; background: radial-gradient(circle, rgba(255,140,80,.30), rgba(255,140,80,0) 70%); }
</style>
