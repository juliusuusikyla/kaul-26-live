/**
 * scroll-reveal-pattern.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Scroll-driven reveal/hide for D3 charts. One global listener, any number
 * of charts on the page.
 *
 * REQUIRED HTML (one per chart — id must be unique per chart)
 * ───────────────────────────────
 *   <div id="scrolly-1" class="scrolly-zone">
 *     <div class="sticky-chart">
 *       <!-- your SVG -->
 *     </div>
 *   </div>
 *
 *   <div id="scrolly-2" class="scrolly-zone">  <!-- second chart -->
 *     <div class="sticky-chart"> ... </div>
 *   </div>
 *
 * REQUIRED CSS  (class-based so all zones share the same rules)
 * ───────────────────────────────
 *   .scrolly-zone  { position: relative; }
 *   .sticky-chart  { position: sticky; top: 0; height: 100vh; }
 *
 * MARKING ELEMENTS IN D3 (do this when you create elements)
 * ───────────────────────────────
 *   circles
 *     .attr("data-scroll-zone", "scrolly-1")   // which zone this belongs to
 *     .attr("data-scroll-index", (_, i) => i) // reveal order (0-based)
 *     .classed("scroll-item", true)
 *
 * DEFAULT BEHAVIOUR: opacity 0 → 1 on reveal, 1 → 0 on hide.
 * No extra config needed for simple fades.
 *
 * CUSTOM ANIMATIONS: pass onReveal / onHide when registering.
 * Only needed when the animation is more than a fade (e.g. bubble grow).
 *
 * USAGE
 * ───────────────────────────────
 *   // Simple fade — no custom functions needed
 *   registerScrollZone({ zoneId: "scrolly-1", itemCount: data.length });
 *
 *   // Custom animation
 *   registerScrollZone({
 *     zoneId: "scrolly-2",
 *     itemCount: data.length,
 *     stepPx: 200,                       // optional, default 280
 *     onReveal: (i, zone) => {
 *       d3.select(zone).select(`[data-scroll-index="${i}"]`)
 *         .transition().duration(400).attr("r", data[i].r);
 *     },
 *     onHide: (i, zone) => {
 *       d3.select(zone).select(`[data-scroll-index="${i}"]`)
 *         .transition().duration(300).attr("r", 0);
 *     },
 *   });
 */

const _scrollZones = [];

function registerScrollZone({ zoneId, itemCount, stepPx = 280, onReveal, onHide }) {
  const el = document.getElementById(zoneId);
  if (!el) { console.warn(`scroll-reveal: #${zoneId} not found`); return; }

  // Make zone tall enough to scroll through all items
  el.style.height = `calc(100vh + ${itemCount * stepPx}px)`;

  _scrollZones.push({
    el,
    itemCount,
    stepPx,
    currentIndex: -1,
    // Default: opacity fade. Custom functions override this.
    onReveal: onReveal ?? ((i, zone) => {
      d3.select(zone).selectAll(`[data-scroll-index="${i}"]`)
        .transition().duration(400).attr("opacity", 1);
    }),
    onHide: onHide ?? ((i, zone) => {
      d3.select(zone).selectAll(`[data-scroll-index="${i}"]`)
        .transition().duration(300).attr("opacity", 0);
    }),
  });
}

// Single scroll listener handles all registered zones
window.addEventListener("scroll", () => {
  for (const zone of _scrollZones) {
    const scrolled = Math.max(0, -zone.el.getBoundingClientRect().top);
    const upTo = scrolled === 0
      ? -1
      : Math.min(zone.itemCount - 1, Math.floor(scrolled / zone.stepPx));

    if (upTo > zone.currentIndex) {
      for (let i = zone.currentIndex + 1; i <= upTo; i++) zone.onReveal(i, zone.el);
    } else if (upTo < zone.currentIndex) {
      for (let i = zone.currentIndex; i > upTo; i--) zone.onHide(i, zone.el);
    }
    zone.currentIndex = upTo;
  }
});
