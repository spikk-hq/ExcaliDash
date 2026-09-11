import type { GraphState, EquationState } from "./types";

export const GRAPH_DATA_KEY = "excalimathGraph";
export const EQUATION_DATA_KEY = "excalimathEquation";
export const GRAPH_WIDTH = 640;
export const GRAPH_HEIGHT = 400;
export const GRAPH_COLORS = [
  "#7048e8",
  "#e64980",
  "#1971c2",
  "#2f9e44",
  "#f08c00",
];

export const createMathId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;

export const createDefaultGraphState = (): GraphState => ({
  version: 1,
  expressions: [
    {
      id: createMathId(),
      expression: "",
      color: GRAPH_COLORS[0],
      visible: true,
    },
  ],
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  xTickStep: undefined,
  yTickStep: undefined,
  showGrid: true,
});

export const copyGraphState = (state: GraphState): GraphState => ({
  ...state,
  expressions: state.expressions.map((expression) => ({ ...expression })),
});

export const getGraphState = (element: any): GraphState | null => {
  const value = element?.customData?.[GRAPH_DATA_KEY];
  return value && typeof value === "object" ? (value as GraphState) : null;
};

export const getEquationState = (element: any): EquationState | null => {
  const value = element?.customData?.[EQUATION_DATA_KEY];
  return value && typeof value === "object" ? (value as EquationState) : null;
};

export const getSelectedCustomElement = (
  api: any,
  getState: (element: any) => unknown,
) => {
  const selectedIds = api.getAppState().selectedElementIds;
  return api
    .getSceneElements()
    .find((element: any) => selectedIds[element.id] && getState(element));
};

export const CUSTOM_TOOL_SHORTCUTS = {
  graph: "c",
  equation: "m",
} as const;

export type CustomToolShortcut = keyof typeof CUSTOM_TOOL_SHORTCUTS;

export const getCustomToolShortcutLabel = (tool: CustomToolShortcut) =>
  CUSTOM_TOOL_SHORTCUTS[tool].toUpperCase();

export const getCustomToolFromShortcut = (
  event: Pick<
    KeyboardEvent,
    | "altKey"
    | "ctrlKey"
    | "isComposing"
    | "key"
    | "metaKey"
    | "repeat"
    | "shiftKey"
  >,
): CustomToolShortcut | null => {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.repeat ||
    event.isComposing
  ) {
    return null;
  }
  const key = event.key.toLowerCase();
  return (
    (Object.keys(CUSTOM_TOOL_SHORTCUTS) as CustomToolShortcut[]).find(
      (tool) => CUSTOM_TOOL_SHORTCUTS[tool] === key,
    ) ?? null
  );
};

export const isWritableTarget = (target: EventTarget | null) => {
  if (!target || typeof (target as Element).closest !== "function") return false;
  return Boolean(
    (target as Element).closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]',
    ),
  );
};
