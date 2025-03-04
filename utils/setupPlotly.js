let plotlyInstance = null;

export async function getPlotlyInstance() {
  if (!plotlyInstance) {
    // Dynamically import Plotly only on the client-side
    // Plotly requires a matchMedia function on the global object. Why is plotly making me do this?
    global.matchMedia = function() {return false}
    const Plotly = await import("plotly.js/lib/core");
    const scatter = await import("plotly.js/lib/scatter");
    const bar = await import("plotly.js/lib/bar");
    const heatmap = await import("plotly.js/lib/heatmap");

    Plotly.register([scatter, bar, heatmap]);
    plotlyInstance = Plotly;
  }
  return plotlyInstance;
}
