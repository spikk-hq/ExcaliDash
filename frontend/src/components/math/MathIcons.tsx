import { getCustomToolShortcutLabel } from "./model";

export const GraphIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 3v17h17" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M5.5 16.5c3-1 4.2-6.8 7-6.8 2.4 0 2.7 3.2 4.7 3.2 1.3 0 2.1-1.4 3.1-4.4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const EquationIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 5h13M8 5l4 7-4 7h10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MathToolbar = ({
  equationActive,
  onGraph,
  onEquation,
}: {
  equationActive: boolean;
  onGraph: () => void;
  onEquation: () => void;
}) => (
  <div className="MathToolbar">
    <button
      type="button"
      onClick={onGraph}
      title="Create or edit a function graph — C"
      aria-label="Create or edit a function graph"
      aria-keyshortcuts="C"
    >
      <GraphIcon />
      <span>Graph</span>
      <kbd>{getCustomToolShortcutLabel("graph")}</kbd>
    </button>
    <button
      type="button"
      onClick={onEquation}
      title="Place a math equation — M"
      aria-label="Place a math equation"
      aria-keyshortcuts="M"
      aria-pressed={equationActive}
      data-active={equationActive}
    >
      <EquationIcon />
      <span>Equation</span>
      <kbd>{getCustomToolShortcutLabel("equation")}</kbd>
    </button>
  </div>
);
