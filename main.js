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

// Load one JSON spec and draw it into the element. Never throws, so one broken chart can't stop the others.
async function embedChart(el) {
  const url = el.dataset.spec;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} not found (${res.status})`);
    const spec = await res.json();
    if (spec.todo) throw new Error(spec.todo);
    await vegaEmbed(el, spec, { actions: false, renderer: "svg", config: BASE_CONFIG });
  } catch (err) {
    console.warn("Chart failed:", url, err);
    showPlaceholder(el, `Not built yet: ${err.message}`);
  }
}

// Find every <div class="chart" data-spec="..."> on the page and draw it.
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".chart[data-spec]").forEach(embedChart);
});
