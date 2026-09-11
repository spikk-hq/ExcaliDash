import { describe, expect, it } from "vitest";
import { makePlotData, makePlotLayout } from "./graphModel";
import {
  getCustomToolFromShortcut,
  getCustomToolShortcutLabel,
  getEquationState,
  getGraphState,
} from "./model";
import type { GraphState } from "./types";

const graphState = (expression: string): GraphState => ({
  version: 1,
  expressions: [
    {
      id: "function-1",
      expression,
      color: "#7048e8",
      visible: true,
    },
  ],
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  showGrid: true,
});

const shortcutEvent = (key: string, overrides: Partial<KeyboardEvent> = {}) =>
  ({
    altKey: false,
    ctrlKey: false,
    isComposing: false,
    key,
    metaKey: false,
    repeat: false,
    shiftKey: false,
    ...overrides,
  }) as KeyboardEvent;

describe("graph model", () => {
  it("samples a function and keeps sample arrays aligned", async () => {
    const [plot] = await makePlotData(graphState("x^2"));
    expect(plot.x).toHaveLength(700);
    expect(plot.x[0]).toBe(-10);
    expect(plot.x.at(-1)).toBe(10);
    expect(plot.y).toHaveLength(plot.x.length);
    expect(plot.y[0]).toBe(100);
  });

  it("handles invalid results and rejects inverted ranges", async () => {
    const [plot] = await makePlotData(graphState("sqrt(x)"));
    expect(plot.y.some((value) => value === null)).toBe(true);
    await expect(
      makePlotData({ ...graphState("x"), xMin: 10, xMax: -10 }),
    ).rejects.toThrow("Axis maximums must be greater than minimums");
  });

  it("uses independent tick steps", () => {
    const layout = makePlotLayout(
      { ...graphState("x"), xTickStep: 1, yTickStep: 0.5 },
      false,
    );
    expect(layout.xaxis.dtick).toBe(1);
    expect(layout.yaxis.dtick).toBe(0.5);
  });
});

describe("editable math metadata", () => {
  it("reads graph and equation source state", () => {
    const graph = graphState("sin(x)");
    const equation = { version: 1 as const, latex: "\\frac{a}{b}" };
    expect(getGraphState({ customData: { excalimathGraph: graph } })).toEqual(
      graph,
    );
    expect(
      getEquationState({ customData: { excalimathEquation: equation } }),
    ).toEqual(equation);
    expect(getEquationState({ customData: {} })).toBeNull();
  });
});

describe("math shortcuts", () => {
  it("maps C and M without modifiers", () => {
    expect(getCustomToolFromShortcut(shortcutEvent("C"))).toBe("graph");
    expect(getCustomToolFromShortcut(shortcutEvent("m"))).toBe("equation");
    expect(
      getCustomToolFromShortcut(shortcutEvent("c", { ctrlKey: true })),
    ).toBeNull();
    expect(getCustomToolShortcutLabel("graph")).toBe("C");
    expect(getCustomToolShortcutLabel("equation")).toBe("M");
  });
});
