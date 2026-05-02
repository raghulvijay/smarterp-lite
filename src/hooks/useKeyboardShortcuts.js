import { useEffect } from "react";

/**
 * Registers global keyboard shortcuts.
 * Handlers object keys: "ctrl+k", "ctrl+n", "ctrl+d", "escape", "?"
 * Each value is a callback () => void.
 * Shortcuts are suppressed while focus is inside an input/textarea/select/contenteditable.
 */
export default function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        document.activeElement?.isContentEditable;

      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && key === "k") {
        e.preventDefault();
        handlers["ctrl+k"]?.();
        return;
      }

      if (ctrl && key === "n") {
        e.preventDefault();
        handlers["ctrl+n"]?.();
        return;
      }

      if (ctrl && key === "d") {
        e.preventDefault();
        handlers["ctrl+d"]?.();
        return;
      }

      if (!isTyping) {
        if (key === "Escape") {
          handlers["escape"]?.();
          return;
        }
        if (key === "?") {
          handlers["?"]?.();
          return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
