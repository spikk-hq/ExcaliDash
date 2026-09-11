import { useEffect, useRef } from "react";

export const MathDialogFrame = ({
  title,
  className,
  onClose,
  children,
}: {
  title: string;
  className?: string;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const ownerDocument = panel?.ownerDocument;
    if (!panel || !ownerDocument) return;
    const activeElement = ownerDocument.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    ownerDocument.addEventListener("keydown", onKeyDown, true);
    return () => {
      ownerDocument.removeEventListener("keydown", onKeyDown, true);
      activeElement?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className={`MathDialogBackdrop ${className ?? ""}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="MathDialogPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="math-dialog-title"
      >
        <header className="MathDialogHeader">
          <h2 id="math-dialog-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </header>
        <div className="MathDialogBody">{children}</div>
      </div>
    </div>
  );
};

export const MathDialogButton = ({
  children,
  primary = false,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={primary ? "MathDialogButton is-primary" : "MathDialogButton"}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </button>
);
