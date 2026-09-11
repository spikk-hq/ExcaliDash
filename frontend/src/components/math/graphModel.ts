import type { GraphState } from "./types";

const SAMPLE_COUNT = 700;

export const makePlotData = async (state: GraphState) => {
  if (!(state.xMax > state.xMin) || !(state.yMax > state.yMin)) {
    throw new Error("Axis maximums must be greater than minimums.");
  }

  const { compile } = await import("mathjs");

  return state.expressions
    .filter((item) => item.visible && item.expression.trim())
    .map((item) => {
      const evaluator = compile(item.expression);
      const x: number[] = [];
      const y: Array<number | null> = [];
      const step = (state.xMax - state.xMin) / (SAMPLE_COUNT - 1);
      let previous: number | null = null;

      for (let index = 0; index < SAMPLE_COUNT; index++) {
        const xValue = state.xMin + step * index;
        let yValue: number | null = null;
        try {
          const result = evaluator.evaluate({ x: xValue });
          if (typeof result === "number" && Number.isFinite(result)) {
            yValue = result;
          }
        } catch {
          yValue = null;
        }

        const jumpLimit = Math.max(20, (state.yMax - state.yMin) * 4);
        if (
          previous !== null &&
          yValue !== null &&
          Math.abs(yValue - previous) > jumpLimit
        ) {
          yValue = null;
        }
        x.push(xValue);
        y.push(yValue);
        previous = yValue;
      }

      return {
        x,
        y,
        type: "scatter" as const,
        mode: "lines" as const,
        name: item.expression,
        connectgaps: false,
        line: { color: item.color, width: 3 },
        hovertemplate: "x=%{x:.3g}<br>y=%{y:.3g}<extra></extra>",
      };
    });
};

export const makePlotLayout = (state: GraphState, darkMode: boolean) => {
  const background = darkMode ? "#121212" : "#ffffff";
  const foreground = darkMode ? "#f1f3f5" : "#1b1b1f";
  const grid = darkMode ? "#34343a" : "#e7e7ec";
  return {
    autosize: true,
    paper_bgcolor: background,
    plot_bgcolor: background,
    font: { color: foreground, family: "Virgil, sans-serif", size: 13 },
    margin: { l: 48, r: 20, t: 24, b: 42 },
    showlegend: state.expressions.filter((item) => item.visible).length > 1,
    legend: { orientation: "h" as const, y: 1.08, x: 0 },
    xaxis: {
      range: [state.xMin, state.xMax],
      dtick: state.xTickStep,
      zeroline: true,
      zerolinecolor: foreground,
      zerolinewidth: 1.5,
      showgrid: state.showGrid,
      gridcolor: grid,
      linecolor: foreground,
      ticks: "outside" as const,
    },
    yaxis: {
      range: [state.yMin, state.yMax],
      dtick: state.yTickStep,
      zeroline: true,
      zerolinecolor: foreground,
      zerolinewidth: 1.5,
      showgrid: state.showGrid,
      gridcolor: grid,
      linecolor: foreground,
      ticks: "outside" as const,
    },
  };
};

export const PLOT_CONFIG = {
  responsive: true,
  displaylogo: false,
  scrollZoom: true,
  modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d"],
};
