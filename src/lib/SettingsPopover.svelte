<script>
  import Select from './Select.svelte'
  import Icon from './Icon.svelte'
  import { settings, PRESETS, MIN_SPAN, gridMode } from './settings.svelte.js'

  let { onclose } = $props()

  const hh = (h) => `${String(h).padStart(2, '0')}:00`
  const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i)
  const startOpts = range(0, 24 - MIN_SPAN).map((h) => ({ value: h, label: hh(h) }))
  const endOpts = $derived(range(settings.dayStart + MIN_SPAN, 24).map((h) => ({ value: h, label: hh(h) })))
  const GRID = [
    { value: 'auto', label: 'Automatic' },
    { value: 'hourly', label: 'Every hour labelled' },
    { value: 'hybrid', label: 'Hybrid (2-hour labels)' },
  ]
  const gridLabel = $derived(GRID.find((g) => g.value === settings.gridStyle).label)
  const active = $derived(PRESETS.find(([, s, e]) => s === settings.dayStart && e === settings.dayEnd)?.[0] ?? null)

  function setStart(h) {
    settings.dayStart = h
    if (settings.dayEnd - h < MIN_SPAN) settings.dayEnd = h + MIN_SPAN
  }
  const preset = (s, e) => { settings.dayStart = s; settings.dayEnd = e }
</script>

<div class="row top">
  <h2>Day length</h2>
  <button class="iconbtn" aria-label="Close" onclick={onclose}><Icon name="close" /></button>
</div>

<div class="seg" role="radiogroup" aria-label="Day length">
  {#each PRESETS as [name, s, e]}
    <button type="button" role="radio" aria-checked={active === name} class:on={active === name} onclick={() => preset(s, e)}>
      <b>{name}</b><span>{hh(s).slice(0, 2)}–{hh(e).slice(0, 2)}</span>
    </button>
  {/each}
</div>

<div class="row">
  <span class="lbl">Custom hours</span>
  <Select options={startOpts} value={settings.dayStart} onpick={setStart} label="First visible hour" menuWidth={120}>{hh(settings.dayStart)}</Select>
  <span class="dash">–</span>
  <Select options={endOpts} value={settings.dayEnd} onpick={(h) => (settings.dayEnd = h)} label="Last visible hour" menuWidth={120}>{hh(settings.dayEnd)}</Select>
</div>

<div class="row">
  <span class="lbl">Grid lines</span>
  <Select options={GRID} value={settings.gridStyle} onpick={(v) => (settings.gridStyle = v)} label="Grid lines" chevron menuWidth={230}>{gridLabel}</Select>
</div>
<p class="hint">
  Events outside the visible hours are kept, just hidden or clipped. {settings.gridStyle === 'auto' ? `Automatic uses ${gridMode()} lines for this length.` : ''}
</p>

<style>
  .top { justify-content: space-between; margin-bottom: -4px; }
  h2 { margin: 0 0 0 4px; font-size: 18px; font-weight: 650; }
  .top .iconbtn { margin-right: -10px; }
  .seg { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 16px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); }
  .seg button { height: 52px; border: 0; border-radius: 12px; background: transparent; color: var(--text); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
  .seg button b { font-size: 14px; font-weight: 650; }
  .seg button span { font-size: 12px; opacity: .65; font-variant-numeric: tabular-nums; }
  .seg button.on { background: rgba(255,255,255,.14); box-shadow: inset 0 0 0 1px rgba(255,255,255,.22); }
  .lbl { width: 96px; flex: none; font-size: 13px; color: rgba(244,246,251,.7); }
  .dash { opacity: .5; }
  .hint { margin: 0; font-size: 12px; line-height: 17px; color: rgba(244,246,251,.55); }
</style>
