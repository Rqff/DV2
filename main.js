/* ---------- Shared look for every Vega-Lite chart ----------
   Edit this one object to restyle all charts at once. */
const BASE_CONFIG = {
  font: "Source Sans 3, sans-serif",
  background: null,
  view: { stroke: null },
  title: { font: "Fraunces, Georgia, serif", fontSize: 17, anchor: "start", subtitleColor: "#566a6e", subtitleFontSize: 13 },
  axis: { labelFontSize: 12, titleFontSize: 12, domainColor: "#9aa9ab", gridColor: "#dfe7e6", tickColor: "#9aa9ab" },
  legend: { labelFontSize: 12, titleFontSize: 12 },
  range: {
    category: ["#c8402b", "#1f6f78", "#e0a526", "#5b4b8a", "#6a994e", "#8d6e63"],
    ramp: { scheme: "oranges" }
  }
};

/* ---------- Helpers ---------- */

// Shown when a spec is missing or marked as "todo", so the layout still looks planned.
function showPlaceholder(el, reason) {
  el.classList.add("placeholder");
  el.innerHTML =
    `<strong>${el.dataset.title || "Chart slot"}</strong>` +
    `<span>${el.dataset.idiom || ""}</span>` +
    `<small>${reason}</small>`;
}

// Draw one chart. If a spec says "width": "container", we measure the chart's box ourselves
// and use that number, which is more reliable than letting Vega-Lite measure it.
async function drawChart(el, spec) {
  const s = JSON.parse(JSON.stringify(spec));   // copy, so the original is kept for redraws
  if (s.width === "container") {
    const isVegaLite = (s.$schema || "").includes("vega-lite");
    // Vega-Lite: make the legend and margins fit inside the measured width.
    // Full Vega (treemap, Sankey): just use the width, minus its 5px side padding.
    s.width = Math.max(280, Math.floor(el.clientWidth) - (isVegaLite ? 0 : 10));
    if (isVegaLite) s.autosize = { type: "fit", contains: "padding" };
  }
  el.classList.remove("placeholder");
  await vegaEmbed(el, s, { actions: false, renderer: "svg", config: BASE_CONFIG });
  el._drawnWidth = el.clientWidth;
}

// Load one JSON spec and draw it. Never throws, so one broken chart can't stop the others.
async function embedChart(el) {
  const url = el.dataset.spec;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} not found (${res.status})`);
    const spec = await res.json();
    if (spec.todo) throw new Error(spec.todo);
    el._spec = spec;
    await drawChart(el, spec);
  } catch (err) {
    console.warn("Chart failed:", url, err);
    showPlaceholder(el, `Not built yet: ${err.message}`);
  }
}

// Find every <div class="chart" data-spec="..."> on the page and draw it.
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".chart[data-spec]").forEach(embedChart);
});

// Redraw container-width charts when the window is resized.
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    document.querySelectorAll(".chart").forEach(el => {
      if (el._spec && el._spec.width === "container" && Math.abs(el.clientWidth - el._drawnWidth) > 20) {
        drawChart(el, el._spec).catch(err => console.warn("Redraw failed:", err));
      }
    });
  }, 250);
});
