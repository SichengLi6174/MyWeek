<script>
  import Icon from './Icon.svelte'
  import { fmtLongDate, fmtTime } from './dates.js'
  import { repeatLabel } from './events.js'

  let { occ, onedit, onduplicate, ondelete, oncolour, onclose } = $props()
  const COLOURS = [['high', 'High'], ['medium', 'Medium'], ['low', 'Low'], ['personal', 'Personal']]
  const label = $derived(COLOURS.find(([v]) => v === occ.colour)[1])
</script>

<div class="row bar">
  <button class="iconbtn" aria-label="Edit" onclick={onedit}><Icon name="edit" /></button>
  <button class="iconbtn" aria-label="Duplicate" onclick={onduplicate}><Icon name="copy" /></button>
  <button class="iconbtn" aria-label="Delete" onclick={ondelete}><Icon name="trash" /></button>
  <button class="iconbtn close" aria-label="Close" onclick={onclose}><Icon name="close" /></button>
</div>

<div class="row" style="align-items:flex-start">
  <span class="sq"><span style="background:rgb(var(--{occ.colour}));box-shadow:0 0 0 3px rgba(var(--{occ.colour}),.3)"></span></span>
  <div class="head">
    <h2>{occ.title}</h2>
    <span class="when">{fmtLongDate(occ.date)} · {fmtTime(occ.startMin)} – {fmtTime(occ.endMin)}</span>
  </div>
</div>

{#if occ.repeat !== 'none'}
  <div class="row info"><span class="ico"><Icon name="repeat" /></span>{repeatLabel(occ.repeat, occ.date)}</div>
{/if}
{#if occ.notes}
  <div class="row info" style="align-items:flex-start"><span class="ico"><Icon name="lines" /></span><span class="notes">{occ.notes}</span></div>
{/if}

<div class="sep"></div>
<div class="row foot" role="radiogroup" aria-label="Importance">
  <span class="ico"><Icon name="flag" /></span>
  {#each COLOURS as [v, name]}
    <button class="iconbtn" class:on={occ.colour === v} role="radio" aria-checked={occ.colour === v} aria-label={name}
      onclick={() => oncolour(v)}>
      <span class="dot" style="--c:var(--{v})">{#if occ.colour === v}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0B0F1C" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>{/if}</span>
    </button>
  {/each}
  <span class="lvl">{label}</span>
</div>

<style>
  .bar { justify-content: flex-end; gap: 2px; margin-right: -8px; }
  .close { background: rgba(255,255,255,.08); }
  .sq { width: 24px; height: 28px; display: flex; align-items: center; justify-content: center; }
  .sq span { width: 16px; height: 16px; border-radius: 5px; }
  .head { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  h2 { margin: 0; font-size: 22px; line-height: 28px; font-weight: 650; overflow-wrap: anywhere; }
  .when { font-size: 14px; color: rgba(244,246,251,.75); font-variant-numeric: tabular-nums; }
  .info { font-size: 14px; }
  .info .ico { height: 24px; }
  .notes { white-space: pre-wrap; overflow-wrap: anywhere; user-select: text; -webkit-user-select: text; }
  .sep { height: 1px; background: rgba(255,255,255,.10); }
  .foot { gap: 0; }
  .foot .ico { margin-right: 14px; }
  .foot .iconbtn.on { background: rgba(255,255,255,.12); }
  .dot { width: 22px; height: 22px; border-radius: 50%; background: rgb(var(--c)); display: flex; align-items: center; justify-content: center; }
  .on .dot { box-shadow: 0 0 0 3px rgba(var(--c), .35); }
  .lvl { margin-left: 12px; font-size: 13px; opacity: .65; }
</style>
