import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { Socket } from "socket.io-client";
import { EquationDialog } from "./EquationDialog";
import { EquationDraftOverlay } from "./EquationDraftOverlay";
import { GraphDialog } from "./GraphDialog";
import { MathToolbar } from "./MathIcons";
import {
  createMathId,
  getCustomToolFromShortcut,
  getEquationState,
  getGraphState,
  getSelectedCustomElement,
  isWritableTarget,
} from "./model";
import type {
  EquationDraft,
  EquationDraftSocketUpdate,
  EquationDraftUpdate,
  MathToolDialogState,
} from "./types";
import "./math-tools.css";
import "./math-fields.css";

type UseMathToolsParams = {
  canEdit: boolean;
  drawingId?: string;
  editorContainerRef: RefObject<HTMLDivElement>;
  excalidrawAPIRef: MutableRefObject<ExcalidrawImperativeAPI | null>;
  isReady: boolean;
  socketRef: MutableRefObject<Socket | null>;
};

export const useMathTools = ({
  canEdit,
  drawingId,
  editorContainerRef,
  excalidrawAPIRef,
  isReady,
  socketRef,
}: UseMathToolsParams) => {
  const [dialog, setDialog] = useState<MathToolDialogState>(null);
  const [equationActive, setEquationActive] = useState(false);
  const [localDraft, setLocalDraft] = useState<EquationDraft | null>(null);
  const [remoteDrafts, setRemoteDrafts] = useState(
    new Map<string, EquationDraft>(),
  );
  const [overlayAppState, setOverlayAppState] = useState<any>(null);
  const [apiForRender, setApiForRender] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [containerForRender, setContainerForRender] =
    useState<HTMLDivElement | null>(null);
  const lastCustomClickRef = useRef<{ elementId: string; time: number } | null>(
    null,
  );
  const hasDraftsRef = useRef(false);

  const openGraph = useCallback(() => {
    const api = excalidrawAPIRef.current;
    if (!api || !canEdit) return;
    const selected = getSelectedCustomElement(api, getGraphState);
    setDialog({ type: "graph", editingElementId: selected?.id ?? null });
  }, [canEdit, excalidrawAPIRef]);

  const activateEquation = useCallback(() => {
    const api = excalidrawAPIRef.current;
    if (!api || !canEdit) return;
    const selected = getSelectedCustomElement(api, getEquationState);
    if (selected) {
      setDialog({
        type: "equation",
        editingElementId: selected.id,
        insertionPoint: null,
        sessionId: createMathId(),
      });
      api.setActiveTool({ type: "selection" });
      setEquationActive(false);
      return;
    }
    const activeTool = api.getAppState().activeTool;
    if (activeTool.type === "custom" && activeTool.customType === "equation") {
      api.setActiveTool({ type: "selection" });
      setEquationActive(false);
      return;
    }
    api.setActiveTool({ type: "custom", customType: "equation" } as any);
    setEquationActive(true);
  }, [canEdit, excalidrawAPIRef]);

  const handleDraftChange = useCallback(
    (update: EquationDraftUpdate) => {
      setLocalDraft((current) => {
        if (update.action === "update") return update.draft;
        return current?.sessionId === update.sessionId ? null : current;
      });
      if (drawingId && socketRef.current) {
        socketRef.current.volatile.emit("equation-draft", {
          drawingId,
          ...update,
        });
      }
    },
    [drawingId, socketRef],
  );

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !drawingId || !isReady) return;
    const onDraft = (update: EquationDraftSocketUpdate) => {
      setRemoteDrafts((current) => {
        const next = new Map(current);
        if (update.action === "update") {
          next.set(update.senderId, update.draft);
        } else if (next.get(update.senderId)?.sessionId === update.sessionId) {
          next.delete(update.senderId);
        }
        return next;
      });
    };
    const onSenderLeft = ({ senderId }: { senderId?: string }) => {
      if (!senderId) return;
      setRemoteDrafts((current) => {
        const next = new Map(current);
        next.delete(senderId);
        return next;
      });
    };
    socket.on("equation-draft", onDraft);
    socket.on("equation-draft-sender-left", onSenderLeft);
    return () => {
      socket.off("equation-draft", onDraft);
      socket.off("equation-draft-sender-left", onSenderLeft);
      setRemoteDrafts(new Map());
    };
  }, [drawingId, isReady, socketRef]);

  useEffect(() => {
    hasDraftsRef.current = Boolean(localDraft || remoteDrafts.size);
    if (hasDraftsRef.current) {
      setOverlayAppState(excalidrawAPIRef.current?.getAppState() ?? null);
    }
  }, [excalidrawAPIRef, localDraft, remoteDrafts]);

  useEffect(() => {
    const api = excalidrawAPIRef.current;
    if (!api || !isReady) return;
    setApiForRender(api);
    setContainerForRender(editorContainerRef.current);
    const syncState = (_elements: readonly any[], appState: any) => {
      const active =
        appState.activeTool.type === "custom" &&
        appState.activeTool.customType === "equation";
      setEquationActive((current) => (current === active ? current : active));
      if (hasDraftsRef.current) setOverlayAppState(appState);
    };
    setOverlayAppState(api.getAppState());
    return api.onChange(syncState);
  }, [editorContainerRef, excalidrawAPIRef, isReady]);

  useEffect(() => {
    const ownerDocument = editorContainerRef.current?.ownerDocument;
    if (!ownerDocument || !isReady || !canEdit) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const api = excalidrawAPIRef.current;
      const activeTool = api?.getAppState().activeTool;
      if (
        event.key === "Escape" &&
        !dialog &&
        api &&
        activeTool?.type === "custom" &&
        activeTool.customType === "equation"
      ) {
        event.preventDefault();
        event.stopPropagation();
        api.setActiveTool({ type: "selection" });
        setEquationActive(false);
        return;
      }
      const tool = getCustomToolFromShortcut(event);
      if (!tool || event.defaultPrevented || dialog || isWritableTarget(event.target)) {
        return;
      }
      const appState = api?.getAppState();
      if (
        !api ||
        !appState ||
        appState.openDialog ||
        appState.openMenu ||
        appState.newElement ||
        appState.selectionElement ||
        appState.selectedElementsAreBeingDragged
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (tool === "graph") openGraph();
      else activateEquation();
    };
    ownerDocument.addEventListener("keydown", onKeyDown, true);
    return () => ownerDocument.removeEventListener("keydown", onKeyDown, true);
  }, [
    activateEquation,
    canEdit,
    dialog,
    editorContainerRef,
    excalidrawAPIRef,
    isReady,
    openGraph,
  ]);

  const onPointerDown = useCallback(
    (activeTool: any, pointerDownState: any) => {
      const api = excalidrawAPIRef.current;
      if (!api || !canEdit) return;
      if (activeTool.type === "custom" && activeTool.customType === "equation") {
        setDialog({
          type: "equation",
          editingElementId: null,
          insertionPoint: { ...pointerDownState.origin },
          sessionId: createMathId(),
        });
        api.setActiveTool({ type: "selection" });
        setEquationActive(false);
        return;
      }

      const hitElement = pointerDownState.hit.element;
      const isEquation = Boolean(getEquationState(hitElement));
      const isGraph = Boolean(getGraphState(hitElement));
      if (!hitElement || (!isEquation && !isGraph)) {
        lastCustomClickRef.current = null;
        return;
      }
      const now = Date.now();
      const lastClick = lastCustomClickRef.current;
      if (
        lastClick &&
        lastClick.elementId === hitElement.id &&
        now - lastClick.time < 400
      ) {
        lastCustomClickRef.current = null;
        if (isEquation) {
          setDialog({
            type: "equation",
            editingElementId: hitElement.id,
            insertionPoint: null,
            sessionId: createMathId(),
          });
        } else {
          setDialog({ type: "graph", editingElementId: hitElement.id });
        }
        return;
      }
      lastCustomClickRef.current = { elementId: hitElement.id, time: now };
    },
    [canEdit, excalidrawAPIRef],
  );

  const closeDialog = useCallback(() => setDialog(null), []);
  const dialogNode = dialog && apiForRender ? (
    dialog.type === "graph" ? (
      <GraphDialog
        api={apiForRender}
        editingElementId={dialog.editingElementId}
        onClose={closeDialog}
      />
    ) : (
      <EquationDialog
        api={apiForRender}
        editingElementId={dialog.editingElementId}
        insertionPoint={dialog.insertionPoint}
        sessionId={dialog.sessionId}
        onDraftChange={handleDraftChange}
        onClose={closeDialog}
      />
    )
  ) : null;

  return {
    dialogNode,
    onPointerDown,
    overlayNode: (
      <EquationDraftOverlay
        drafts={[
          ...remoteDrafts.values(),
          ...(localDraft ? [localDraft] : []),
        ]}
        appState={overlayAppState}
        container={containerForRender}
      />
    ),
    renderTopRightUI: canEdit
      ? () => (
          <MathToolbar
            equationActive={equationActive}
            onGraph={openGraph}
            onEquation={activateEquation}
          />
        )
      : undefined,
    openGraph,
    activateEquation,
  };
};
