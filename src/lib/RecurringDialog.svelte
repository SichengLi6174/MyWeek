<script>
  let { type = 'edit', subtitle, repeatChanged = false, onok, oncancel } = $props()

  const ALL = [['this', 'This event'], ['following', 'This and following events'], ['all', 'All events']]
  // A change to the repeat rule can't apply to a single occurrence.
  const choices = $derived(repeatChanged ? ALL.slice(1) : ALL)
  // svelte-ignore state_referenced_locally
  let scope = $state(repeatChanged ? 'following' : 'this')
  const heading = $derived(type === 'delete' ? 'Delete recurring event' : 'Edit recurring event')

  let box = $state()
  $effect(() => { box?.querySelector('input:checked')?.focus() })

  function key(e) {
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); oncancel() }
  }
</script>

<svelte:window onkeydowncapture={key} />

<div class="backdrop" role="presentation"></div>
<form class="pop dlg" role="dialog" aria-modal="true" aria-label={heading} bind:this={box}
  onsubmit={(e) => { e.preventDefault(); onok(scope) }}>
  <div class="head">
    <h2>{heading}</h2>
    <span>{subtitle}</span>
  </div>
  <div class="choices" role="radiogroup" aria-label="Apply to">
    {#each choices as [v, label]}
      <label class="radio" class:on={scope === v}>
        <input type="radio" name="scope" value={v} bind:group={scope} />{label}
      </label>
    {/each}
  </div>
  <div class="row btns">
    <button type="button" class="secondary" onclick={oncancel}>Cancel</button>
    <button type="submit" class="primary">OK</button>
  </div>
</form>

<style>
  .backdrop { position: fixed; inset: 0; z-index: 60; background: rgba(5,8,16,.42); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
  .dlg {
    position: fixed; z-index: 61; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: min(400px, calc(100vw - 24px)); padding: 24px; gap: 18px; border-radius: 28px;
    display: flex; flex-direction: column;
    background: linear-gradient(180deg, rgba(44,50,74,.90), rgba(22,26,42,.93));
    border: 1px solid rgba(255,255,255,.18);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.28), 0 30px 80px rgba(0,0,0,.55);
    backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%);
  }
  .head { display: flex; flex-direction: column; gap: 6px; }
  h2 { margin: 0; font-size: 21px; font-weight: 650; }
  .head span { font-size: 14px; color: rgba(244,246,251,.7); }
  .choices { display: flex; flex-direction: column; gap: 4px; }
  .radio { height: 48px; padding: 0 14px; border-radius: 14px; display: flex; align-items: center; gap: 12px; font-size: 15px; cursor: pointer; }
  .radio.on { background: rgba(255,255,255,.10); box-shadow: inset 0 0 0 1px rgba(255,255,255,.16); }
  .radio input { width: 18px; height: 18px; margin: 0; accent-color: #5ca8ff; }
  .btns { justify-content: flex-end; gap: 8px; }
  .secondary { height: 44px; padding: 0 20px; border: 1px solid rgba(255,255,255,.16); border-radius: 22px; background: rgba(255,255,255,.08); color: #f4f6fb; font-size: 14px; font-weight: 600; }
  .btns :global(.primary) { padding: 0 28px; }
</style>
