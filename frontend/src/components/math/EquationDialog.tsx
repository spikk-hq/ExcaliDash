import { useCallback, useEffect, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  CaptureUpdateAction,
  MIME_TYPES,
  convertToExcalidrawElements,
  newElementWith,
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { MathDialogButton, MathDialogFrame } from "./MathDialogFrame";
import { EquationIcon } from "./MathIcons";
import { EQUATION_KEY_GROUPS } from "./equationKeys";
import { makeEquationSvg } from "./equationSvg";
import {
  EQUATION_DATA_KEY,
  createMathId,
  getEquationState,
} from "./model";
import type {
  EquationDraftUpdate,
  EquationPoint,
  EquationState,
} from "./types";

export const EquationDialog = ({
  api,
  editingElementId,
  insertionPoint,
  sessionId,
  onDraftChange,
  onClose,
}: {
  api: ExcalidrawImperativeAPI;
  editingElementId: string | null;
  insertionPoint: EquationPoint | null;
  sessionId: string;
  onDraftChange: (update: EquationDraftUpdate) => void;
  onClose: () => void;
}) => {
  const editingElement = editingElementId
    ? api
        .getSceneElements()
        .find((element) => element.id === editingElementId)
    : undefined;
  const savedState = getEquationState(editingElement);
  const [latex, setLatex] = useState(savedState?.latex ?? "");
  const [activeKeyGroup, setActiveKeyGroup] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLInputElement>(null);
  const renderSequenceRef = useRef(0);

  const close = useCallback(() => {
    renderSequenceRef.current += 1;
    onDraftChange({ action: "clear", sessionId });
    onClose();
  }, [onClose, onDraftChange, sessionId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    katex.render(latex || "\\phantom{x}", host, {
      displayMode: true,
      throwOnError: false,
    });
  }, [latex]);

  useEffect(() => {
    const host = hostRef.current;
    const ownerWindow = host?.ownerDocument.defaultView;
    const value = latex.trim();
    if (!host || !ownerWindow) return;
    if (!value) {
      renderSequenceRef.current += 1;
      onDraftChange({ action: "clear", sessionId });
      return;
    }

    const timeout = ownerWindow.setTimeout(() => {
      const sequence = ++renderSequenceRef.current;
      void makeEquationSvg(value, host.ownerDocument)
        .then((rendered) => {
          if (sequence !== renderSequenceRef.current) return;
          const currentElement = editingElementId
            ? api
                .getSceneElements()
                .find((element) => element.id === editingElementId)
            : undefined;
          const point = insertionPoint ?? { x: 0, y: 0 };
          const center = currentElement
            ? {
                x: currentElement.x + currentElement.width / 2,
                y: currentElement.y + currentElement.height / 2,
              }
            : point;
          onDraftChange({
            action: "update",
            draft: {
              sessionId,
              elementId: currentElement?.id ?? null,
              x: center.x - rendered.width / 2,
              y: center.y - rendered.height / 2,
              width: rendered.width,
              height: rendered.height,
              dataURL: rendered.dataURL,
              mask: currentElement
                ? {
                    x: currentElement.x,
                    y: currentElement.y,
                    width: currentElement.width,
                    height: currentElement.height,
                  }
                : null,
            },
          });
        })
        .catch((previewError) => {
          setError(
            previewError instanceof Error
              ? previewError.message
              : "The live equation preview could not be updated.",
          );
        });
    }, 200);
    return () => ownerWindow.clearTimeout(timeout);
  }, [api, editingElementId, insertionPoint, latex, onDraftChange, sessionId]);

  const insertLatex = (value: string) => {
    const source = sourceRef.current;
    const start = source?.selectionStart ?? latex.length;
    const end = source?.selectionEnd ?? start;
    const firstPlaceholder = value.indexOf("#?");
    const inserted = value.replaceAll("#?", "");
    const cursorPosition =
      start + (firstPlaceholder === -1 ? inserted.length : firstPlaceholder);
    setLatex(`${latex.slice(0, start)}${inserted}${latex.slice(end)}`);
    source?.ownerDocument.defaultView?.setTimeout(() => {
      source.focus();
      source.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  const saveEquation = async () => {
    const value = latex.trim();
    if (!value) {
      setError("Enter an equation.");
      return;
    }
    const host = hostRef.current;
    if (!host) return;
    setIsSaving(true);
    try {
      const rendered = await makeEquationSvg(value, host.ownerDocument);
      const fileId = createMathId();
      const now = Date.now();
      api.addFiles([
        {
          id: fileId as any,
          mimeType: MIME_TYPES.svg,
          dataURL: rendered.dataURL as any,
          created: now,
          lastRetrieved: now,
        },
      ]);
      const equationState: EquationState = { version: 1, latex: value };
      const currentElement = editingElementId
        ? api
            .getSceneElementsIncludingDeleted()
            .find((element) => element.id === editingElementId)
        : undefined;

      if (currentElement?.type === "image") {
        const updated = newElementWith(currentElement, {
          fileId: fileId as any,
          status: "pending",
          x: currentElement.x + (currentElement.width - rendered.width) / 2,
          y: currentElement.y + (currentElement.height - rendered.height) / 2,
          width: rendered.width,
          height: rendered.height,
          customData: {
            ...currentElement.customData,
            [EQUATION_DATA_KEY]: equationState,
          },
        });
        api.updateScene({
          elements: api
            .getSceneElementsIncludingDeleted()
            .map((element) => (element.id === updated.id ? updated : element)),
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      } else {
        const point = insertionPoint ?? { x: 0, y: 0 };
        const [element] = convertToExcalidrawElements(
          [
            {
              type: "image",
              x: point.x - rendered.width / 2,
              y: point.y - rendered.height / 2,
              width: rendered.width,
              height: rendered.height,
              fileId: fileId as any,
              status: "pending",
              customData: { [EQUATION_DATA_KEY]: equationState },
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
      onDraftChange({ action: "clear", sessionId });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The equation cannot be inserted.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MathDialogFrame
      title={editingElement ? "Edit equation" : "Insert equation"}
      className="EquationDialog"
      onClose={close}
    >
      <p className="MathHint">
        Type with your keyboard or select symbols from the math keyboard.
      </p>
      <div ref={hostRef} className="EquationPreview" />
      <div className="EquationKeyboard" aria-label="Math symbols">
        <div className="EquationTabs" role="tablist">
          {EQUATION_KEY_GROUPS.map((group, index) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={activeKeyGroup === index}
              onClick={() => setActiveKeyGroup(index)}
            >
              {group.label}
            </button>
          ))}
        </div>
        <div className="EquationKeys">
          {EQUATION_KEY_GROUPS[activeKeyGroup].keys.map((item) => (
            <button
              key={`${item.label}-${item.latex}`}
              type="button"
              title={`Insert ${item.label}`}
              aria-label={`Insert ${item.label}`}
              onClick={() => insertLatex(item.latex)}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(item.previewLatex ?? item.latex, {
                  throwOnError: false,
                }),
              }}
            />
          ))}
        </div>
      </div>
      <label className="EquationSource">
        <span>LaTeX source</span>
        <input
          ref={sourceRef}
          value={latex}
          onChange={(event) => {
            setLatex(event.target.value);
            setError(null);
          }}
          spellCheck={false}
          autoComplete="off"
          autoFocus
          onKeyDown={(event) => event.stopPropagation()}
          onKeyUp={(event) => event.stopPropagation()}
        />
      </label>
      {error ? <div className="MathError">{error}</div> : null}
      <div className="MathFooter">
        <span>Double-click an equation on the board to edit it later.</span>
        <div className="MathActions">
          <MathDialogButton onClick={close}>Cancel</MathDialogButton>
          <MathDialogButton primary onClick={saveEquation} disabled={isSaving}>
            <EquationIcon size={18} />
            {isSaving
              ? "Rendering…"
              : editingElement
                ? "Update equation"
                : "Insert equation"}
          </MathDialogButton>
        </div>
      </div>
    </MathDialogFrame>
  );
};
