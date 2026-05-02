import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext();

const TYPE_META = {
  success: { bg: "#10b981", icon: "bi-check-circle-fill",         label: "Success" },
  error:   { bg: "#ef4444", icon: "bi-x-circle-fill",             label: "Error"   },
  warning: { bg: "#f59e0b", icon: "bi-exclamation-triangle-fill", label: "Warning" },
  info:    { bg: "#4f46e5", icon: "bi-info-circle-fill",          label: "Info"    },
};

function Toast({ id, message, type, onClose }) {
  const meta = TYPE_META[type] || TYPE_META.info;

  return (
    <div
      className="erp-toast"
      role="alert"
      aria-live="assertive"
      style={{ "--toast-bg": meta.bg }}
    >
      <div className="erp-toast-icon">
        <i className={`bi ${meta.icon}`} />
      </div>
      <span className="erp-toast-message">{message}</span>
      <button className="erp-toast-close" onClick={() => onClose(id)} aria-label="Dismiss">
        <i className="bi bi-x" />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div className="erp-toast-container" aria-label="Notifications">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={onClose} />
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts]  = useState([]);
  const nextId               = useRef(0);
  const timers               = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={dismiss} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
