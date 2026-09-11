import { GRAPH_COLORS, createMathId } from "./model";
import type { GraphExpression, GraphState } from "./types";

export const GraphControls = ({
  state,
  setState,
}: {
  state: GraphState;
  setState: React.Dispatch<React.SetStateAction<GraphState>>;
}) => {
  const updateExpression = (id: string, updates: Partial<GraphExpression>) => {
    setState((current) => ({
      ...current,
      expressions: current.expressions.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    }));
  };
  const addExpression = () => {
    setState((current) => {
      if (current.expressions.length >= GRAPH_COLORS.length) return current;
      return {
        ...current,
        expressions: [
          ...current.expressions,
          {
            id: createMathId(),
            expression: "",
            color: GRAPH_COLORS[current.expressions.length],
            visible: true,
          },
        ],
      };
    });
  };
  const applyPreset = (expression: string, bounds?: Partial<GraphState>) => {
    setState((current) => ({
      ...current,
      ...bounds,
      expressions: [
        {
          id: createMathId(),
          expression,
          color: GRAPH_COLORS[0],
          visible: true,
        },
      ],
    }));
  };

  return (
    <section className="GraphDialogControls" aria-label="Graph settings">
      <div>
        <div className="MathEyebrow">Functions</div>
        <p className="MathHint">
          Use x as the variable. Examples: x^2, sin(x), 2*x + 1.
        </p>
      </div>
      <div className="GraphExpressions">
        {state.expressions.map((item, index) => (
          <div className="GraphExpression" key={item.id}>
            <button
              type="button"
              className="GraphVisibility"
              style={{ color: item.color }}
              aria-label={item.visible ? "Hide function" : "Show function"}
              aria-pressed={item.visible}
              onClick={() =>
                updateExpression(item.id, { visible: !item.visible })
              }
            >
              {item.visible ? "●" : "○"}
            </button>
            <label htmlFor={`graph-expression-${item.id}`}>{index + 1}</label>
            <input
              id={`graph-expression-${item.id}`}
              value={item.expression}
              onChange={(event) =>
                updateExpression(item.id, { expression: event.target.value })
              }
              placeholder="sin(x)"
              autoComplete="off"
              spellCheck={false}
              autoFocus={index === 0}
            />
            {state.expressions.length > 1 ? (
              <button
                type="button"
                className="GraphRemove"
                aria-label={`Remove function ${index + 1}`}
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    expressions: current.expressions.filter(
                      (candidate) => candidate.id !== item.id,
                    ),
                  }))
                }
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="GraphAdd"
        onClick={addExpression}
        disabled={state.expressions.length >= GRAPH_COLORS.length}
      >
        + Add function
      </button>
      <GraphPresets onApply={applyPreset} />
      <GraphAxes state={state} setState={setState} />
      <label className="GraphGridToggle">
        <input
          type="checkbox"
          checked={state.showGrid}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              showGrid: event.target.checked,
            }))
          }
        />
        Show grid
      </label>
    </section>
  );
};

const GraphPresets = ({
  onApply,
}: {
  onApply: (expression: string, bounds?: Partial<GraphState>) => void;
}) => (
  <div>
    <div className="MathEyebrow">Examples</div>
    <div className="GraphPresets">
      <button type="button" onClick={() => onApply("2*x + 1")}>
        Linear
      </button>
      <button type="button" onClick={() => onApply("x^2")}>
        Parabola
      </button>
      <button
        type="button"
        onClick={() =>
          onApply("sin(x)", {
            xMin: -2 * Math.PI,
            xMax: 2 * Math.PI,
            yMin: -2,
            yMax: 2,
          })
        }
      >
        Sine
      </button>
      <button type="button" onClick={() => onApply("1/x")}>
        Reciprocal
      </button>
      <button type="button" onClick={() => onApply("abs(x)")}>
        Absolute value
      </button>
    </div>
  </div>
);

const GraphAxes = ({
  state,
  setState,
}: {
  state: GraphState;
  setState: React.Dispatch<React.SetStateAction<GraphState>>;
}) => (
  <>
    <fieldset className="GraphAxes">
      <legend>Axis range</legend>
      {(["xMin", "xMax", "yMin", "yMax"] as const).map((key) => (
        <label key={key}>
          <span>{key.replace("Min", " min").replace("Max", " max")}</span>
          <input
            type="number"
            step="any"
            value={state[key]}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                [key]: Number(event.target.value),
              }))
            }
          />
        </label>
      ))}
    </fieldset>
    <fieldset className="GraphAxes">
      <legend>Tick spacing</legend>
      {(["xTickStep", "yTickStep"] as const).map((key) => (
        <label key={key}>
          <span>{key === "xTickStep" ? "X step" : "Y step"}</span>
          <input
            type="number"
            min="0"
            step="any"
            value={state[key] ?? ""}
            placeholder="Auto"
            onChange={(event) =>
              setState((current) => ({
                ...current,
                [key]: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              }))
            }
          />
        </label>
      ))}
    </fieldset>
  </>
);
