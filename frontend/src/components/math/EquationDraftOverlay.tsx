import { sceneCoordsToViewportCoords } from "@excalidraw/excalidraw";
import type { EquationDraft } from "./types";

export const EquationDraftOverlay = ({
  drafts,
  appState,
  container,
}: {
  drafts: EquationDraft[];
  appState: any;
  container: HTMLDivElement | null;
}) => {
  if (!appState || !container || drafts.length === 0) return null;
  const containerBounds = container.getBoundingClientRect();
  const getStyle = (box: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    const position = sceneCoordsToViewportCoords(
      { sceneX: box.x, sceneY: box.y },
      appState,
    );
    return {
      left: position.x - containerBounds.left,
      top: position.y - containerBounds.top,
      width: box.width * appState.zoom.value,
      height: box.height * appState.zoom.value,
    };
  };

  return (
    <div className="EquationDraftOverlay" aria-hidden="true">
      {drafts.map((draft) => (
        <div key={`${draft.sessionId}-${draft.elementId ?? "new"}`}>
          {draft.mask ? (
            <div
              className="EquationDraftMask"
              style={{
                ...getStyle(draft.mask),
                backgroundColor: appState.viewBackgroundColor,
              }}
            />
          ) : null}
          <img
            className="EquationDraftImage"
            src={draft.dataURL}
            style={getStyle(draft)}
            alt=""
          />
        </div>
      ))}
    </div>
  );
};
