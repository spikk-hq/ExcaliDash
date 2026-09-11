export type GraphExpression = {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
};

export type GraphState = {
  version: 1;
  expressions: GraphExpression[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xTickStep?: number;
  yTickStep?: number;
  showGrid: boolean;
};

export type EquationState = {
  version: 1;
  latex: string;
};

export type EquationPoint = { x: number; y: number };

export type EquationDraft = {
  sessionId: string;
  elementId: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  dataURL: string;
  mask: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
};

export type EquationDraftUpdate =
  | { action: "update"; draft: EquationDraft }
  | { action: "clear"; sessionId: string };

export type EquationDraftSocketUpdate = EquationDraftUpdate & {
  senderId: string;
};

export type MathToolDialogState =
  | { type: "graph"; editingElementId: string | null }
  | {
      type: "equation";
      editingElementId: string | null;
      insertionPoint: EquationPoint | null;
      sessionId: string;
    }
  | null;
