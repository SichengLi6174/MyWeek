<script>
  import Icon from './Icon.svelte'
  import Select from './Select.svelte'
  import { fmtTime, fmtShortDate, fmtDuration, START_HOUR, END_HOUR } from './dates.js'
  import { repeatLabel } from './events.js'

  let { initial, onlive = () => {}, onsave, onclose } = $props()

  const MIN = START_HOUR * 60, MAX = END_HOUR * 60
  // svelte-ignore state_referenced_locally
  let f = $state({ ...initial })
  const COLOURS = [['high', 'High'], ['medium', 'Medium'], ['low', 'Low'], ['personal', 'Personal']]
  const range = (a, b) => Array.from({ length: Math.max(0, (b - a) / 30 + 1) }, (_, i) => a + i * 30)
  const startOpts = $derived(range(MIN, MAX - 30).map((m) => ({ value: m, label: fmtTime(m) })))
  const endOpts = $derived(range(f.startMin + 30, MAX).map((m) => ({ value: m, label: fmtTime(m) })))
  const repeatOpts = $derived(['none', 'daily', 'weekly', 'weekdays'].map((v) => ({ value: v, label: repeatLabel(v, f.date) })))

  function setStart(m) {
    const dur = f.endMin - f.startMin // keep duration; clamp at 17:00
    f.startMin = m
    f.endMin = Math.min(MAX, m + dur)
  }

  $effect(() => { onlive($state.snapshot(f)) })

  let titleEl, notesEl
  $effect(() => { titleEl?.focus() })
  const grow = () => { if (notesEl) { notesEl.style.height = 'auto'; notesEl.style.height = notesEl.scrollHeight + 'px' } }
  $effect(() => { f.notes; grow() })

  const save = () => onsave($state.snapshot(f))
  function onenter(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); save() }
  }
</script>

<div class="row top">
  <span class="grabber"></span>
  <button class="iconbtn" aria-label="Close" onclick={onclose}><Icon name="close" /></button>
</div>

<input bind:this={titleEl} class="title" aria-label="Event title" placeholder="Add title" bind:value={f.title}
  onkeydown={onenter} style="--c:var(--{f.colour})" />

<div class="row">
  <span class="ico"><Icon name="clock" /></span>
  <label class="well datewell">
    {fmtShortDate(f.date)}
    <input type="date" aria-label="Date" bind:value={f.date} required />
  </label>
  <Select options={startOpts} value={f.startMin} onpick={setStart} label="Start time" menuWidth={120}>{fmtTime(f.startMin)}</Select>
  <span class="dash">–</span>
  <Select options={endOpts} value={f.endMin} onpick={(m) => (f.endMin = m)} label="End time" menuWidth={120}>{fmtTime(f.endMin)}</Select>
  <span class="dur">{fmtDuration(f.endMin - f.startMin)}</span>
</div>

<div class="row">
  <span class="ico"><Icon name="repeat" /></span>
  <Select options={repeatOpts} value={f.repeat} onpick={(v) => (f.repeat = v)} label="Repeat" chevron>
    {repeatLabel(f.repeat, f.date)}
  </Select>
</div>

<div class="row" style="align-items:flex-start">
  <span class="ico"><Icon name="flag" /></span>
  <div class="swatches" role="radiogroup" aria-label="Importance">
    {#each COLOURS as [v, name]}
      <button type="button" role="radio" aria-checked={f.colour === v} class="sw" class:on={f.colour === v}
        style="--c:var(--{v})" onclick={() => (f.colour = v)}>
        <span class="dot">{#if f.colour === v}<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0B0F1C" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>{/if}</span>{name}
      </button>
    {/each}
  </div>
</div>

<div class="row" style="align-items:flex-start">
  <span class="ico"><Icon name="lines" /></span>
  <textarea bind:this={notesEl} class="well notes" rows="1" aria-label="Notes" placeholder="Add notes"
    bind:value={f.notes} oninput={grow} onkeydown={onenter}></textarea>
</div>

<div class="row foot">
  <button type="button" class="link" disabled title="Coming later">More options</button>
  <button type="button" class="primary" onclick={save}>Save</button>
</div>

<style>
  .top { justify-content: space-between; }
  .grabber { width: 36px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.22); margin-left: 4px; }
  .top .iconbtn { margin-right: -10px; }
  .title {
    height: 54px; padding: 0 14px; border-radius: 14px; background: rgba(255,255,255,.07); color: #fff;
    font: inherit; font-size: 21px; font-weight: 600; outline: none; border: 1px solid rgba(255,255,255,.10);
  }
  .title::placeholder { color: rgba(244,246,251,.45); }
  .title:focus { border-color: rgba(var(--c), .85); box-shadow: 0 0 0 3px rgba(var(--c), .28); }
  :global(.pop .well) {
    height: 44px; padding: 0 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.08);
    color: #f4f6fb; font: inherit; font-size: 14px; font-weight: 500; display: inline-flex; align-items: center; gap: 10px;
    font-variant-numeric: tabular-nums;
  }
  .datewell { position: relative; padding: 0 14px; cursor: pointer; }
  .datewell input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  .dash { opacity: .5; margin: -6px; }
  .dur { font-size: 12px; opacity: .55; white-space: nowrap; }
  .swatches { flex: 1; display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 4px; }
  .sw { height: 64px; border: 0; border-radius: 14px; background: transparent; color: #f4f6fb; font-size: 12px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; }
  .sw:hover { background: rgba(255,255,255,.06); }
  .sw.on { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.22); }
  .dot { width: 24px; height: 24px; border-radius: 50%; background: rgb(var(--c)); display: flex; align-items: center; justify-content: center; }
  .sw.on .dot { box-shadow: 0 0 0 3px rgba(var(--c), .35); }
  .notes { flex: 1; min-height: 44px; max-height: 120px; padding: 12px 14px; resize: none; line-height: 18px; outline: none; user-select: text; -webkit-user-select: text; }
  .notes::placeholder { color: rgba(244,246,251,.45); }
  .notes:focus { border-color: rgba(255,255,255,.28); }
  .foot { justify-content: space-between; margin-top: 4px; }
  .link:disabled { opacity: .45; cursor: default; }
  .title { user-select: text; -webkit-user-select: text; }
</style>
