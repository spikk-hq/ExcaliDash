import katex from "katex";

const blobToDataUrl = (blob: Blob, ownerWindow: Window) =>
  new Promise<string>((resolve, reject) => {
    const OwnerFileReader = (ownerWindow as Window & typeof globalThis)
      .FileReader;
    const reader = new OwnerFileReader();
    reader.onerror = () => reject(new Error("The equation image could not be encoded."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });

export const makeEquationSvg = async (
  latex: string,
  ownerDocument: Document,
) => {
  const ownerWindow = ownerDocument.defaultView;
  if (!ownerWindow) throw new Error("The equation editor window is unavailable.");
  const rendered = katex.renderToString(latex, {
    displayMode: true,
    output: "mathml",
    throwOnError: true,
  });
  const measurement = ownerDocument.createElement("div");
  measurement.className = "EquationMeasurement";
  measurement.innerHTML = rendered;
  ownerDocument.body.appendChild(measurement);
  const bounds = measurement.getBoundingClientRect();
  const math = measurement.querySelector("math")?.outerHTML;
  measurement.remove();
  if (!math) throw new Error("The equation could not be rendered as MathML.");

  const width = Math.max(96, Math.ceil(bounds.width) + 32);
  const height = Math.max(64, Math.ceil(bounds.height) + 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="box-sizing:border-box;color:#1b1b1f;display:flex;align-items:center;justify-content:center;font-size:40px;height:100%;padding:12px 16px;white-space:nowrap">${math}</div></foreignObject></svg>`;
  const dataURL = await blobToDataUrl(
    new ownerWindow.Blob([svg], { type: "image/svg+xml" }),
    ownerWindow,
  );
  return { width, height, dataURL };
};
