import { describe, expect, it } from "vitest";
import { parseEquationDraftUpdate } from "./equationDraft";

const update = {
  action: "update",
  draft: {
    sessionId: "session-1",
    elementId: null,
    x: 1,
    y: 2,
    width: 120,
    height: 70,
    dataURL: "data:image/svg+xml;base64,PHN2Zy8+",
    mask: null,
  },
};

describe("parseEquationDraftUpdate", () => {
  it("accepts a valid update and clear message", () => {
    expect(parseEquationDraftUpdate(update)).toEqual(update);
    expect(
      parseEquationDraftUpdate({ action: "clear", sessionId: "session-1" }),
    ).toEqual({ action: "clear", sessionId: "session-1" });
  });

  it("rejects unsafe image data and invalid geometry", () => {
    expect(
      parseEquationDraftUpdate({
        ...update,
        draft: { ...update.draft, dataURL: "javascript:alert(1)" },
      }),
    ).toBeNull();
    expect(
      parseEquationDraftUpdate({
        ...update,
        draft: { ...update.draft, width: -1 },
      }),
    ).toBeNull();
  });

  it("rejects an invalid session id", () => {
    expect(
      parseEquationDraftUpdate({
        ...update,
        draft: { ...update.draft, sessionId: "bad id" },
      }),
    ).toBeNull();
    expect(
      parseEquationDraftUpdate({ action: "clear", sessionId: "bad id" }),
    ).toBeNull();
  });
});
