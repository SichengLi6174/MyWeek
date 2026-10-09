<script>
  // Glass popover shell: anchors beside an element, flips left near the right
  // edge, clamps vertically, closes on Escape / outside click.
  let { anchorKey, width = 404, onclose, children, label = '' } = $props()

  const MARGIN = 12
  let el = $state()
  let h = $state(0)
  let pos = $state({ left: -9999, top: 0 })

  function place() {
    const a = document.querySelector(`[data-key="${CSS.escape(anchorKey)}"]`)
    if (!a || !h) return
    const r = a.getBoundingClientRect()
    const vw = innerWidth, vh = innerHeight
    let left = r.right + MARGIN
    if (left + width > vw - MARGIN) left = r.left - MARGIN - width
    left = Math.max(MARGIN, Math.min(left, vw - width - MARGIN))
    const top = Math.max(MARGIN, Math.min(r.top, vh - h - MARGIN))
    pos = { left, top }
  }
  $effect(() => { anchorKey; h; place() })

  function onkey(e) {
    if (e.key === 'Escape') { e.preventDefault(); onclose() }
  }
  function onoutside(e) {
    if (el && !el.contains(e.target)) onclose()
  }
</script>

<svelte:window onresize={place} onkeydown={onkey} onpointerdowncapture={onoutside} />

<div class="pop" role="dialog" aria-label={label} bind:this={el} bind:offsetHeight={h}
  style="left:{pos.left}px;top:{pos.top}px;width:{width}px">
  {@render children()}
</div>

<style>
  .pop {
    position: fixed; z-index: 50; border-radius: 26px; padding: 14px 18px 18px;
    display: flex; flex-direction: column; gap: 14px; max-height: calc(100vh - 24px); overflow: visible;
    background: linear-gradient(180deg, rgba(44,50,74,.90), rgba(22,26,42,.93));
    border: 1px solid rgba(255,255,255,.18);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.28), 0 30px 80px rgba(0,0,0,.55);
    backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%);
  }
  :global(.pop .row) { display: flex; gap: 14px; align-items: center; }
  :global(.pop .ico) { width: 24px; height: 44px; flex: none; display: flex; align-items: center; justify-content: center; color: rgba(244,246,251,.6); }
  :global(.pop .iconbtn) { width: 44px; height: 44px; border: 0; border-radius: 22px; background: transparent; color: rgba(244,246,251,.78); display: flex; align-items: center; justify-content: center; }
  :global(.pop .iconbtn:hover) { background: rgba(255,255,255,.08); }
  :global(.pop .primary) {
    height: 44px; padding: 0 26px; border: 1px solid rgba(255,255,255,.6); border-radius: 22px;
    background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(232,236,246,.9));
    box-shadow: inset 0 1px 0 #fff, 0 8px 22px rgba(0,0,0,.35); color: #0b0f1c; font-size: 14px; font-weight: 650;
  }
  :global(.pop .link) { height: 44px; padding: 0 14px; border: 0; background: transparent; color: #9cc8ff; font-size: 14px; font-weight: 600; }
  :global(.pop :focus-visible) { outline: 2px solid rgba(156,200,255,.85); outline-offset: 2px; }
</style>
