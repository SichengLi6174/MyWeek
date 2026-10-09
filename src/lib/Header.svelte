<script>
  import { monthYear, isoWeek, weekRange } from './dates.js'

  let { anchor, onprev, onnext, ontoday, onnew = () => {}, onexport, onimport } = $props()

  let menuOpen = $state(false)
  let wrap = $state()
  let fileEl = $state()
  function pickFile(e) {
    const f = e.currentTarget.files?.[0]
    e.currentTarget.value = ''
    if (f) onimport(f)
  }
</script>

<svelte:window onpointerdowncapture={(e) => { if (menuOpen && !wrap?.contains(e.target)) menuOpen = false }}
  onkeydowncapture={(e) => { if (menuOpen && e.key === 'Escape') { e.stopPropagation(); menuOpen = false } }} />

<header>
  <div class="title">
    <h1>{monthYear(anchor)}</h1>
    <span>Week {isoWeek(anchor)} · {weekRange(anchor)}</span>
  </div>
  <div class="right">
    <div class="legend">
      <span><i style="background:rgb(var(--high))"></i>High</span>
      <span><i style="background:rgb(var(--medium))"></i>Medium</span>
      <span><i style="background:rgb(var(--low))"></i>Low</span>
      <span><i style="background:rgb(var(--personal))"></i>Personal</span>
    </div>
    <div class="seg">
      <button aria-label="Previous week" onclick={onprev}>‹</button>
      <button onclick={ontoday}>Today</button>
      <button aria-label="Next week" onclick={onnext}>›</button>
    </div>
    <div class="more" bind:this={wrap}>
      <button class="seg-btn" aria-label="Backup" aria-haspopup="menu" aria-expanded={menuOpen} onclick={() => (menuOpen = !menuOpen)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
      </button>
      {#if menuOpen}
        <div class="menu" role="menu">
          <button role="menuitem" onclick={() => { menuOpen = false; onexport() }}>Export JSON</button>
          <button role="menuitem" onclick={() => { menuOpen = false; fileEl.click() }}>Import JSON…</button>
        </div>
      {/if}
      <input bind:this={fileEl} type="file" accept="application/json,.json" hidden onchange={pickFile} />
    </div>
    <button class="primary" onclick={onnew}>+ New event</button>
  </div>
</header>

<style>
  header { position: relative; height: 64px; flex: none; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; }
  h1 { margin: 0; font-size: 30px; font-weight: 650; letter-spacing: -0.02em; }
  .title { display: flex; align-items: baseline; gap: 14px; }
  .title span { font-size: 15px; color: var(--text-muted); }
  .right { display: flex; align-items: center; gap: 18px; }
  .legend { display: flex; gap: 14px; font-size: 13px; color: rgba(244,246,251,.78); }
  .legend span { display: flex; align-items: center; gap: 6px; }
  .legend i { width: 8px; height: 8px; border-radius: 50%; }
  .seg {
    display: flex; height: 44px; border-radius: 22px; background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.16); box-shadow: inset 0 1px 0 rgba(255,255,255,.22);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  }
  .seg button { height: 42px; min-width: 44px; border: 0; background: transparent; font-size: 14px; font-weight: 600; padding: 0 10px; }
  .more { position: relative; }
  .seg-btn {
    width: 44px; height: 44px; border-radius: 22px; background: rgba(255,255,255,.08); display: grid; place-items: center;
    border: 1px solid rgba(255,255,255,.16); box-shadow: inset 0 1px 0 rgba(255,255,255,.22);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  }
  .menu {
    position: absolute; right: 0; top: 52px; z-index: 40; width: 190px; padding: 6px; border-radius: 18px;
    display: flex; flex-direction: column;
    background: linear-gradient(180deg, rgba(52,58,84,.98), rgba(30,34,52,.99)); border: 1px solid rgba(255,255,255,.18);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 24px 60px rgba(0,0,0,.55);
  }
  .menu button { height: 44px; padding: 0 12px; border: 0; border-radius: 12px; background: transparent; text-align: left; font-size: 14px; }
  .menu button:hover { background: rgba(255,255,255,.08); }
  .primary {
    height: 44px; border-radius: 22px; border: 1px solid rgba(255,255,255,.35);
    background: linear-gradient(180deg, rgba(255,255,255,.30), rgba(255,255,255,.14));
    box-shadow: inset 0 1px 0 rgba(255,255,255,.55), 0 8px 20px rgba(0,0,0,.25);
    color: #fff; font-size: 14px; font-weight: 600; padding: 0 18px;
  }
</style>
