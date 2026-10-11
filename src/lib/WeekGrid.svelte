<script>
  import { expand, layoutDay } from './events.js'
  import { DAY_NAMES, weekDates, parseDate, fmtTime, nowMin } from './dates.js'
  import { settings, gridMode } from './settings.svelte.js'

  let { anchor, today, events, draft = null, selectedKey = null, onsweep, onsweepend, onopen, onmoveend, preview = null } = $props()

  // The visible day is a setting; everything below derives from it.
  const MIN = $derived(settings.dayStart * 60)
  const MAX = $derived(settings.dayEnd * 60)
  const SPAN = $derived(MAX - MIN)
  const hours = $derived(Array.from({ length: settings.dayEnd - settings.dayStart + 1 }, (_, i) => settings.dayStart + i))
  const pct = (min) => ((min - MIN) / SPAN) * 100

  // hourly: every line and label. hybrid: lines every hour, labels on every 2nd hour from the day start.
  const hybrid = $derived(gridMode() === 'hybrid')
  const isMajor = (h) => (h - settings.dayStart) % 2 === 1
  const labelHours = $derived(hybrid ? hours.filter((h) => h > settings.dayStart && isMajor(h)) : hours)

  let now = $state(nowMin())
  $effect(() => {
    const t = setInterval(() => (now = nowMin()), 30000)
    return () => clearInterval(t)
  })

  const dates = $derived(weekDates(anchor))
  const occurrences = $derived(expand(events, dates))
  // Events outside the day range are hidden; ones that straddle its edge are clipped.
  const eventsFor = (date) =>
    layoutDay(occurrences.filter((o) => o.date === date && o.key !== preview?.key && o.endMin > MIN && o.startMin < MAX))
  const clip = (s, e) => [Math.max(s, MIN), Math.min(e, MAX)]

  // Card layout from rendered height: full >= 60px, mid 30-59px, compact < 30px.
  const heightPx = (s, e) => ((e - s) / 60) * hourPx - 4
  const sizeOf = (h) => (h < 30 ? 'compact' : h < 60 ? 'mid' : 'full')

  // --- click / drag on empty space to sweep out a range ---
  let sweep = null // { date, rect, a, x, y, moved, cancelled }
  const minAt = (rect, y) => Math.max(MIN, Math.min(MAX, MIN + ((y - rect.top) / rect.height) * SPAN))
  function sweepDraft(m) {
    let s, e
    if (!sweep.moved) { s = Math.min(Math.floor(m / 30) * 30, MAX - 60); e = s + 60 }
    else {
      const lo = Math.min(sweep.a, m), hi = Math.max(sweep.a, m)
      s = Math.min(Math.floor(lo / 30) * 30, MAX - 30)
      e = Math.max(Math.ceil(hi / 30) * 30, s + 30)
    }
    return { date: sweep.date, startMin: s, endMin: Math.min(e, MAX), title: '', colour: 'medium', repeat: 'none', notes: '' }
  }
  function down(e, date) {
    if (e.button !== 0 || e.target.closest('.ev')) return
    const rect = e.currentTarget.getBoundingClientRect()
    sweep = { date, rect, a: minAt(rect, e.clientY), x: e.clientX, y: e.clientY, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
    onsweep(sweepDraft(sweep.a))
  }
  function move(e) {
    if (!sweep || sweep.cancelled) return
    if (!sweep.moved && Math.hypot(e.clientX - sweep.x, e.clientY - sweep.y) > 4) sweep.moved = true
    onsweep(sweepDraft(minAt(sweep.rect, e.clientY)))
  }
  function up(e) {
    if (!sweep) return
    const done = !sweep.cancelled
    sweep = null
    if (done) onsweepend()
  }
  function onEscape(e) {
    if (e.key !== 'Escape') return
    if (sweep) { sweep.cancelled = true; onsweep(null) }
    if (drag) drag.cancelled = true
  }

  // --- drag an event to move it, or its top/bottom edge to resize ---
  const snap = (m) => Math.round(m / 30) * 30
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  let drag = $state(null) // { key, ev, mode, x, y, rects, moved, cancelled, dx, dy, cur }
  let suppressClick = false
  const active = $derived(drag && drag.moved && !drag.cancelled ? drag : null)

  function evDown(e, ev) {
    if (e.button !== 0) return
    const rects = [...e.currentTarget.closest('.body').querySelectorAll('.day')].map((d) => d.getBoundingClientRect())
    drag = {
      key: ev.key, ev, mode: e.target.closest('[data-edge]')?.dataset.edge ?? 'move',
      x: e.clientX, y: e.clientY, rects, moved: false, cancelled: false, dx: 0, dy: 0,
      cur: { date: ev.date, startMin: ev.startMin, endMin: ev.endMin },
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function evMove(e) {
    if (!drag || drag.cancelled) return
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y
    if (!drag.moved) {
      if (Math.hypot(dx, dy) <= 4) return
      drag.moved = true
    }
    const o = drag.ev
    const dMin = (dy / drag.rects[0].height) * SPAN
    if (drag.mode === 'move') {
      const dur = o.endMin - o.startMin
      const s = clamp(snap(o.startMin + dMin), MIN, Math.max(MIN, MAX - dur))
      let i = drag.rects.findIndex((r) => e.clientX < r.right)
      if (i === -1) i = drag.rects.length - 1
      drag.dx = dx; drag.dy = dy
      drag.cur = { date: dates[i], startMin: s, endMin: s + dur }
    } else if (drag.mode === 'top') {
      if (o.endMin - MIN < 30) return // too close to the top of the day to shrink from above
      drag.cur = { date: o.date, startMin: clamp(snap(o.startMin + dMin), MIN, o.endMin - 30), endMin: o.endMin }
    } else {
      drag.cur = { date: o.date, startMin: o.startMin, endMin: clamp(snap(o.endMin + dMin), o.startMin + 30, MAX) }
    }
  }
  function evUp() {
    if (!drag) return
    const d = drag
    drag = null
    if (d.cancelled || !d.moved) return
    suppressClick = true
    setTimeout(() => (suppressClick = false), 100)
    const c = d.cur, o = d.ev
    if (c.date !== o.date || c.startMin !== o.startMin || c.endMin !== o.endMin) onmoveend(o, c)
  }
  const clickEv = (ev) => {
    if (suppressClick) { suppressClick = false; return }
    onopen(ev)
  }

  $effect(() => {
    const m = active?.mode
    document.body.classList.toggle('drag-move', m === 'move')
    document.body.classList.toggle('drag-resize', m === 'top' || m === 'bottom')
    return () => document.body.classList.remove('drag-move', 'drag-resize')
  })

  let bodyH = $state(0)
  const hourPx = $derived(bodyH / (settings.dayEnd - settings.dayStart))
  const EDGE = 4, GAP = 1 // px: outer margin, half-gap between squeezed cards
  const place = (ev) => {
    const l = ev.col === 0 ? EDGE : GAP
    const r = ev.col === ev.cols - 1 ? EDGE : GAP
    return `left:calc(${ev.col} * 100% / ${ev.cols} + ${l}px);width:calc(100% / ${ev.cols} - ${l + r}px)`
  }
</script>

{#snippet card(title, repeat, s, e, size, h)}
  <div class="t">
    <i></i><span>{title}</span>
    {#if size === 'compact'}
      <em class="st">{fmtTime(s)}</em>
    {:else if repeat && repeat !== 'none'}
      <svg aria-label="Repeats" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>
    {/if}
  </div>
  {#if size !== 'compact' && h >= 43}<div class="time">{fmtTime(s)}–{fmtTime(e)}</div>{/if}
{/snippet}

<svelte:window onkeydown={onEscape} />

<div class="panel">
  <div class="cols dayhead">
    <div></div>
    {#each dates as date, i}
      <div class="dh" class:today={date === today}>
        <span>{DAY_NAMES[i]}</span><b>{parseDate(date).d}</b>
      </div>
    {/each}
  </div>
  <div class="cols body" bind:clientHeight={bodyH}>
    <div class="gutter">
      {#each labelHours as h}
        <div class="label" style="top:{pct(h * 60)}%">{String(h).padStart(2, '0')}:00</div>
      {/each}
    </div>
    {#each dates as date, i}
      <div class="day" class:today={date === today} class:weekend={i > 4}
        onpointerdown={(e) => down(e, date)} onpointermove={move} onpointerup={up} onpointercancel={up} role="presentation">
        {#each hours.slice(1, -1) as h}
          <div class="line" class:major={hybrid && isMajor(h)} class:minor={hybrid && !isMajor(h)} style="top:{pct(h * 60)}%"></div>
        {/each}
        {#each eventsFor(date) as ev (ev.key)}
          {@const dragging = active?.key === ev.key ? active : null}
          {@const g = dragging && dragging.mode !== 'move' ? dragging.cur : ev}
          {@const [gs, ge] = clip(g.startMin, g.endMin)}
          {@const h = heightPx(gs, ge)}
          {@const size = sizeOf(h)}
          <div class="ev {size}" class:squeezed={ev.cols > 1} class:selected={selectedKey === ev.key || !!dragging} class:dragging={dragging?.mode === 'move'}
            data-key={ev.key} role="button" tabindex="0"
            onpointerdown={(e) => evDown(e, ev)} onpointermove={evMove} onpointerup={evUp} onpointercancel={evUp}
            onclick={() => clickEv(ev)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onopen(ev))}
            style="--tint:var(--{ev.colour});{place(ev)};top:calc({pct(gs)}% + 2px);height:calc({(ge - gs) / SPAN * 100}% - 4px){dragging?.mode === 'move' ? `;transform:translate(${dragging.dx}px,${dragging.dy}px)` : ''}">
            <span class="edge" data-edge="top"></span><span class="edge bottom" data-edge="bottom"></span>
            {@render card(ev.title, ev.repeat, g.startMin, g.endMin, size, h)}
            {#if selectedKey === ev.key || dragging}
              {@const inset = size === 'compact' ? 3 : 4}
              <span class="handle" style="top:{inset}px"></span><span class="handle" style="bottom:{inset}px"></span>
            {/if}
          </div>
        {/each}
        {#if draft && draft.date === date}
          {@const h = heightPx(draft.startMin, draft.endMin)}
          {@const size = sizeOf(h)}
          <div class="ev selected draft {size}" data-key="draft" style="--tint:var(--{draft.colour});left:4px;right:4px;top:calc({pct(draft.startMin)}% + 2px);height:calc({(draft.endMin - draft.startMin) / SPAN * 100}% - 4px)">
            {@render card(draft.title || '(No title)', 'none', draft.startMin, draft.endMin, size, h)}
          </div>
        {/if}
        {#if preview && preview.from.date === date}
          {@const [fs, fe] = clip(preview.from.startMin, preview.from.endMin)}
          <div class="ghost orig" style="top:calc({pct(fs)}% + 2px);height:calc({(fe - fs) / SPAN * 100}% - 4px)"></div>
        {/if}
        {#if preview && preview.to.date === date}
          {@const t = preview.to}
          {@const [ps, pe] = clip(t.startMin, t.endMin)}
          {@const h = heightPx(ps, pe)}
          {@const size = sizeOf(h)}
          <div class="ev selected draft {size}" style="--tint:var(--{preview.colour});left:4px;right:4px;top:calc({pct(ps)}% + 2px);height:calc({(pe - ps) / SPAN * 100}% - 4px)">
            {@render card(preview.title, 'none', t.startMin, t.endMin, size, h)}
          </div>
        {/if}
        {#if active && active.cur.date === date}
          {@const c = active.cur}
          {#if active.mode === 'move'}
            <div class="ghost" style="--tint:var(--{active.ev.colour});top:calc({pct(c.startMin)}% + 2px);height:calc({(c.endMin - c.startMin) / SPAN * 100}% - 4px)"></div>
          {/if}
          <div class="readout" style={c.startMin - MIN < 30 ? `top:calc(${pct(c.endMin)}% + 6px)` : `top:calc(${pct(c.startMin)}% - 6px);transform:translate(-50%,-100%)`}>
            {fmtTime(c.startMin)}–{fmtTime(c.endMin)}
          </div>
        {/if}
        {#if date === today && now >= MIN && now <= MAX}
          <div class="now" style="top:{pct(now)}%"></div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .panel {
    position: relative; flex: 1; min-height: 0; border-radius: 28px; background: rgba(255,255,255,.055);
    border: 1px solid rgba(255,255,255,.12);
    backdrop-filter: blur(30px) saturate(160%); -webkit-backdrop-filter: blur(30px) saturate(160%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 30px 60px rgba(0,0,0,.35);
    padding: 0 16px 14px 0; display: flex; flex-direction: column;
  }
  .cols { display: grid; grid-template-columns: var(--gutter) repeat(7, minmax(0, 1fr)); }
  .dayhead { height: 48px; flex: none; align-items: center; }
  .body { flex: 1; min-height: 0; position: relative; }
  .dh { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--text-muted); }
  .dh b { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-size: 15px; font-weight: 600; color: rgba(244,246,251,.92); }
  .dh.today b { background: var(--now); color: #fff; }
  .gutter { position: relative; }
  .label { position: absolute; right: 12px; transform: translateY(-50%); font-size: 12px; font-variant-numeric: tabular-nums; color: var(--text-faint); }
  .day { position: relative; border-left: 1px solid var(--col-line); }
  .day.today { background: rgba(255,255,255,.035); }
  .day.weekend { background: rgba(255,255,255,.015); }
  .line { position: absolute; left: 0; right: 0; height: 1px; background: var(--line); }
  .line.major { background: rgba(255,255,255,.11); }
  .line.minor { background: rgba(255,255,255,.045); }

  .ev {
    position: absolute; border-radius: 14px; padding: 7px 10px; overflow: hidden;
    display: flex; flex-direction: column; gap: 2px; color: #fff;
    background: linear-gradient(180deg, rgba(var(--tint), .46), rgba(var(--tint), .26));
    border: 1px solid rgba(255,255,255,.28);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.45), inset 0 -1px 0 rgba(255,255,255,.08), 0 8px 24px rgba(0,0,0,.25);
    backdrop-filter: blur(18px) saturate(180%); -webkit-backdrop-filter: blur(18px) saturate(180%);
  }
  .ev { cursor: pointer; touch-action: none; }
  .ev.selected {
    border-color: rgba(255,255,255,.75); z-index: 4;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 0 0 3px rgba(var(--tint), .35), 0 14px 32px rgba(0,0,0,.4);
  }
  .ev.draft { background: linear-gradient(180deg, rgba(var(--tint), .62), rgba(var(--tint), .40)); z-index: 6; pointer-events: none; }
  .handle { position: absolute; left: 50%; width: 28px; height: 4px; margin-left: -14px; border-radius: 2px; background: rgba(255,255,255,.9); }
  .day { touch-action: none; }
  .ev { cursor: grab; }
  .ev.dragging { z-index: 30; transition: none; box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 0 0 3px rgba(var(--tint), .35), 0 22px 44px rgba(0,0,0,.5); }
  .edge { position: absolute; left: 0; right: 0; top: 0; height: 8px; cursor: ns-resize; z-index: 2; }
  .edge.bottom { top: auto; bottom: 0; }
  .ghost { position: absolute; left: 4px; right: 4px; border-radius: 14px; pointer-events: none; z-index: 3;
    border: 1.5px dashed rgba(255,255,255,.55); background: rgba(var(--tint), .16); }
  .ghost.orig { background: rgba(11,15,28,.55); border-color: rgba(255,255,255,.45); }
  .readout { position: absolute; left: 50%; transform: translateX(-50%); z-index: 40; pointer-events: none; white-space: nowrap;
    padding: 5px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; color: #fff;
    background: rgba(22,26,42,.88); border: 1px solid rgba(255,255,255,.18); box-shadow: 0 8px 20px rgba(0,0,0,.4); }
  :global(body.drag-move), :global(body.drag-move *) { cursor: grabbing !important; }
  :global(body.drag-resize), :global(body.drag-resize *) { cursor: ns-resize !important; }
  .ev.mid { padding: 5px 9px; border-radius: 12px; }
  .ev.compact { padding: 0 8px; border-radius: 10px; justify-content: center; }
  .ev.compact .t { font-size: 12px; line-height: 14px; }
  .ev.compact .edge { height: 5px; }
  .st { flex: none; font-style: normal; font-size: 11px; font-weight: 500; color: rgba(255,255,255,.75); font-variant-numeric: tabular-nums; }
  .ev.squeezed { padding: 7px 6px; }
  .ev.mid.squeezed { padding: 5px 6px; }
  .ev.compact.squeezed { padding: 0 6px; }
  .ev.squeezed .time { padding-left: 0; }
  .t { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; line-height: 16px; }
  .t i { width: 7px; height: 7px; border-radius: 50%; flex: none; background: rgb(var(--tint)); }
  .t span { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .t svg { flex: none; opacity: .8; }
  .time { font-size: 12px; line-height: 15px; color: rgba(255,255,255,.78); padding-left: 13px; font-variant-numeric: tabular-nums; }
  .now { position: absolute; left: -5px; right: 0; height: 2px; margin-top: -1px; background: var(--now); box-shadow: 0 0 10px rgba(255,90,78,.7); z-index: 5; pointer-events: none; }
  .now::before { content: ''; position: absolute; left: 0; top: -4px; width: 10px; height: 10px; border-radius: 50%; background: var(--now); }
</style>
