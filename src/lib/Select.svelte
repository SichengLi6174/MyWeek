<script>
  // Well-styled dropdown button with a glass listbox.
  let { options, value, onpick, label, children, class: cls = '', menuWidth = 290, chevron = false } = $props()
  let open = $state(false)
  let menu = $state()
  let wrap = $state()

  $effect(() => {
    if (open && menu) menu.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' })
  })
  function key(e) {
    if (open && e.key === 'Escape') { e.stopPropagation(); open = false }
  }
</script>

<svelte:window onpointerdowncapture={(e) => { if (open && !wrap?.contains(e.target)) open = false }} />

<div class="sel" bind:this={wrap} onkeydowncapture={key} role="presentation">
  <button type="button" class="well {cls}" aria-haspopup="listbox" aria-expanded={open} aria-label={label}
    onclick={() => (open = !open)}>
    {@render children()}
    {#if chevron}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>{/if}
  </button>
  {#if open}
    <div class="menu" role="listbox" aria-label={label} bind:this={menu} style="width:{menuWidth}px">
      {#each options as o (o.value)}
        <button type="button" role="option" class="opt" class:on={o.value === value} aria-selected={o.value === value}
          onclick={() => { onpick(o.value); open = false }}>
          <i>{#if o.value === value}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>{/if}</i>{o.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .sel { position: relative; display: inline-flex; }
  .menu {
    position: absolute; left: 0; top: 50px; z-index: 5; padding: 6px; border-radius: 18px;
    display: flex; flex-direction: column; max-height: 276px; overflow-y: auto;
    background: linear-gradient(180deg, rgba(52,58,84,.98), rgba(30,34,52,.99)); border: 1px solid rgba(255,255,255,.18);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 24px 60px rgba(0,0,0,.55);
  }
  .opt { flex: none; height: 44px; padding: 0 12px; border: 0; border-radius: 12px; background: transparent; color: var(--text);
    display: flex; align-items: center; gap: 10px; font-size: 14px; text-align: left; font-variant-numeric: tabular-nums; }
  .opt:hover { background: rgba(255,255,255,.07); }
  .opt.on { background: rgba(255,255,255,.12); }
  .opt i { width: 16px; display: flex; }
</style>
