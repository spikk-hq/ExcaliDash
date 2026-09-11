const MAX_SESSION_ID_LENGTH = 200;
const MAX_DATA_URL_LENGTH = 512 * 1024;
const SVG_DATA_URL_PREFIX = "data:image/svg+xml;base64,";

type Box = { x: number; y: number; width: number; height: number };

export type SafeEquationDraftUpdate =
  | {
      action: "update";
      draft: Box & {
        sessionId: string;
        elementId: string | null;
        dataURL: string;
        mask: Box | null;
      };
    }
  | { action: "clear"; sessionId: string };

const safeSessionId = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= MAX_SESSION_ID_LENGTH &&
  /^[\w-]+$/.test(value);

const safeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const safeBox = (value: unknown): value is Box => {
  if (!value || typeof value !== "object") return false;
  const box = value as Record<string, unknown>;
  return (
    safeNumber(box.x) &&
    safeNumber(box.y) &&
    safeNumber(box.width) &&
    safeNumber(box.height) &&
    box.width > 0 &&
    box.height > 0 &&
    box.width <= 100000 &&
    box.height <= 100000
  );
};

export const parseEquationDraftUpdate = (
  value: unknown,
): SafeEquationDraftUpdate | null => {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (input.action === "clear") {
    if (!safeSessionId(input.sessionId)) return null;
    return { action: "clear", sessionId: input.sessionId };
  }
  if (input.action !== "update" || !input.draft || typeof input.draft !== "object") {
    return null;
  }
  const candidate = input.draft as Record<string, unknown>;
  if (!safeBox(candidate)) return null;
  const draft = candidate as Box & Record<string, unknown>;
  if (
    !safeSessionId(draft.sessionId) ||
    typeof draft.dataURL !== "string" ||
    !draft.dataURL.startsWith(SVG_DATA_URL_PREFIX) ||
    draft.dataURL.length > MAX_DATA_URL_LENGTH ||
    !(
      draft.elementId === null ||
      (typeof draft.elementId === "string" &&
        draft.elementId.length <= MAX_SESSION_ID_LENGTH)
    ) ||
    !(draft.mask === null || safeBox(draft.mask))
  ) {
    return null;
  }
  return {
    action: "update",
    draft: {
      sessionId: draft.sessionId,
      elementId: draft.elementId as string | null,
      x: draft.x as number,
      y: draft.y as number,
      width: draft.width as number,
      height: draft.height as number,
      dataURL: draft.dataURL,
      mask: draft.mask as Box | null,
    },
  };
};
