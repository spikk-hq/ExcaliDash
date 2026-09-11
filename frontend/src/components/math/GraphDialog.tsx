import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CaptureUpdateAction,
  MIME_TYPES,
  convertToExcalidrawElements,
  newElementWith,
  viewportCoordsToSceneCoords,
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { Config, Data, Layout } from "plotly.js-dist-min";
import { MathDialogButton, MathDialogFrame } from "./MathDialogFrame";
import { GraphIcon } from "./MathIcons";
import { GraphControls } from "./GraphControls";
import {
  GRAPH_DATA_KEY,
  GRAPH_HEIGHT,
  GRAPH_WIDTH,
  copyGraphState,
  createDefaultGraphState,
  createMathId,
  getGraphState,
} from "./model";
import { makePlotData, makePlotLayout, PLOT_CONFIG } from "./graphModel";
import type { GraphState } from "./types";

type PlotlyModule = typeof import("plotly.js-dist-min");

const loadPlotly = async () => (await import("plotly.js-dist-min")).default;

export const GraphDialog = ({
  api,
  editingElementId,
  onClose,
}: {
  api: ExcalidrawImperativeAPI;
  editingElementId: string | null;
  onClose: () => void;
}) => {
  const selectedGraph = useMemo(
    () =>
      editingElementId
        ? api
            .getSceneElements()
            .find((element) => element.id === editingElementId)
        : undefined,
    [api, editingElementId],
  );
  const [state, setState] = useState<GraphState>(() => {
    const saved = getGraphState(selectedGraph);
    return saved ? copyGraphState(saved) : createDefaultGraphState();
  });
  const [error, setError] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<PlotlyModule["default"] | null>(null);
  const darkMode = api.getAppState().theme === "dark";

  const renderPreview = useCallback(async () => {
    if (!previewRef.current) return false;
    try {
      if (
        (state.xTickStep !== undefined && state.xTickStep <= 0) ||
        (state.yTickStep !== undefined && state.yTickStep <= 0)
      ) {
        throw new Error("Tick steps must be greater than zero.");
      }
      const plotly = await loadPlotly();
      plotlyRef.current = plotly;
      const data = await makePlotData(state);
      if (!data.length) throw new Error("Add at least one visible expression.");
      await plotly.react(
        previewRef.current,
        data as Data[],
        makePlotLayout(state, darkMode) as Partial<Layout>,
        PLOT_CONFIG as Partial<Config>,
      );
      setError(null);
      return true;
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : "The graph cannot be rendered.",
      );
      return false;
    }
  }, [darkMode, state]);

  useEffect(() => {
    const ownerWindow = previewRef.current?.ownerDocument.defaultView;
    if (!ownerWindow) return;
    const timeout = ownerWindow.setTimeout(renderPreview, 120);
    return () => ownerWindow.clearTimeout(timeout);
  }, [renderPreview]);

  useEffect(
    () => () => {
      if (plotlyRef.current && previewRef.current) {
        plotlyRef.current.purge(previewRef.current);
      }
    },
    [],
  );

  const insertGraph = async () => {
    if (!previewRef.current || !plotlyRef.current || !(await renderPreview())) {
      return;
    }
    setIsInserting(true);
    try {
      const dataURL = await plotlyRef.current.toImage(previewRef.current, {
        format: "png",
        width: 1280,
        height: 800,
      });
      const fileId = createMathId();
      const now = Date.now();
      api.addFiles([
        {
          id: fileId as any,
          mimeType: MIME_TYPES.png,
          dataURL: dataURL as any,
          created: now,
          lastRetrieved: now,
        },
      ]);
      const graphData = copyGraphState(state);

      if (selectedGraph?.type === "image") {
        const updated = newElementWith(selectedGraph, {
          fileId: fileId as any,
          status: "pending",
          customData: {
            ...selectedGraph.customData,
            [GRAPH_DATA_KEY]: graphData,
          },
        });
        api.updateScene({
          elements: api
            .getSceneElementsIncludingDeleted()
            .map((element) => (element.id === updated.id ? updated : element)),
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      } else {
        const appState = api.getAppState();
        const center = viewportCoordsToSceneCoords(
          {
            clientX: appState.offsetLeft + appState.width / 2,
            clientY: appState.offsetTop + appState.height / 2,
          },
          appState,
        );
        const [element] = convertToExcalidrawElements(
          [
            {
              type: "image",
              x: center.x - GRAPH_WIDTH / 2,
              y: center.y - GRAPH_HEIGHT / 2,
              width: GRAPH_WIDTH,
              height: GRAPH_HEIGHT,
              fileId: fileId as any,
              status: "pending",
              customData: { [GRAPH_DATA_KEY]: graphData },
            },
          ],
          { regenerateIds: true },
        );
        api.updateScene({
          elements: [...api.getSceneElementsIncludingDeleted(), element],
          appState: { selectedElementIds: { [element.id]: true } },
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      }
      onClose();
    } catch (insertError) {
      setError(
        insertError instanceof Error
          ? insertError.message
          : "The graph cannot be inserted.",
      );
    } finally {
      setIsInserting(false);
    }
  };

  return (
    <MathDialogFrame
      title={selectedGraph ? "Edit graph" : "Create graph"}
      className="GraphDialog"
      onClose={onClose}
    >
      <div className="GraphDialogWorkspace">
        <GraphControls state={state} setState={setState} />
        <section className="GraphPreviewSection" aria-label="Graph preview">
          <div className="GraphPreview" ref={previewRef} />
          {error ? <div className="MathError">{error}</div> : null}
          <div className="MathFooter">
            <span>
              {selectedGraph
                ? "This replaces the selected graph."
                : "The graph will be placed at the center of the board."}
            </span>
            <div className="MathActions">
              <MathDialogButton onClick={onClose}>Cancel</MathDialogButton>
              <MathDialogButton
                primary
                onClick={insertGraph}
                disabled={Boolean(error) || isInserting}
              >
                <GraphIcon size={18} />
                {isInserting
                  ? "Rendering…"
                  : selectedGraph
                    ? "Update graph"
                    : "Insert graph"}
              </MathDialogButton>
            </div>
          </div>
        </section>
      </div>
    </MathDialogFrame>
  );
};
