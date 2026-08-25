import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import './toast.css';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

type ToastInput = {
  message: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastRecord = {
  id: number;
  message: string;
  tone: ToastTone;
  durationMs: number;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    const message = input.message.trim();
    if (!message) {
      return;
    }

    const tone = input.tone ?? 'info';
    const durationMs = input.durationMs ?? (tone === 'error' ? 6000 : 4200);

    setToasts((current) => {
      const duplicate = current.some((toast) => toast.message === message && toast.tone === tone);
      if (duplicate) {
        return current;
      }

      const nextToast: ToastRecord = {
        id: nextId.current,
        message,
        tone,
        durationMs,
      };
      nextId.current += 1;
      return [...current.slice(-3), nextToast];
    });
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.');
  }
  return context;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: number) => void;
}) {
  const timeoutRef = useRef<number | null>(null);

  function scheduleDismiss() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => onDismiss(toast.id), toast.durationMs);
  }

  useState(() => {
    scheduleDismiss();
    return undefined;
  });

  return (
    <div
      className={`toast toast-${toast.tone}`}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => {
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }}
      onMouseLeave={scheduleDismiss}
    >
      <span className="toast-icon" aria-hidden="true">{getToastIcon(toast.tone)}</span>
      <span className="toast-message">{toast.message}</span>
      <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}>
        ×
      </button>
    </div>
  );
}

function getToastIcon(tone: ToastTone) {
  if (tone === 'success') return '✓';
  if (tone === 'error') return '!';
  if (tone === 'warning') return '△';
  return 'i';
}
