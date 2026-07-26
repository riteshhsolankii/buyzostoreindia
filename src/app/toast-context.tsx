"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/** Notification kind — drives the icon, accent colour and ARIA urgency. */
export type ToastType = "success" | "error" | "warning" | "info";

export type ToastOptions = {
  type?: ToastType;
  /** Optional bold heading above the message. */
  title?: string;
  /** Milliseconds before auto-dismiss. Pass 0 to keep it until dismissed. */
  duration?: number;
};

type Toast = Required<Pick<ToastOptions, "type">> & {
  id: string;
  message: string;
  title?: string;
  duration: number;
  /** Set while the exit animation plays, just before removal. */
  leaving?: boolean;
};

type ToastContextValue = {
  toast: (message: string, options?: ToastOptions) => string;
  success: (message: string, options?: Omit<ToastOptions, "type">) => string;
  error: (message: string, options?: Omit<ToastOptions, "type">) => string;
  warning: (message: string, options?: Omit<ToastOptions, "type">) => string;
  info: (message: string, options?: Omit<ToastOptions, "type">) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;
/** Errors linger — they usually need reading, not glancing at. */
const ERROR_DURATION = 6000;
/** Keep the stack short so it never covers the page. */
const MAX_VISIBLE = 3;
/** Must stay in sync with --animate-toast-out in globals.css. */
const EXIT_MS = 200;

let counter = 0;
const nextId = () => `toast-${++counter}`;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // id -> pending timers, so unmount and manual dismiss can cancel them.
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>[]>());

  const clearTimers = useCallback((id: string) => {
    timers.current.get(id)?.forEach(clearTimeout);
    timers.current.delete(id);
  }, []);

  const remove = useCallback(
    (id: string) => {
      clearTimers(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [clearTimers]
  );

  /** Play the exit animation, then drop the toast from state. */
  const dismiss = useCallback(
    (id: string) => {
      clearTimers(id);
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
      );
      const exit = setTimeout(() => remove(id), EXIT_MS);
      timers.current.set(id, [exit]);
    },
    [clearTimers, remove]
  );

  const toast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const type = options.type ?? "info";
      const duration =
        options.duration ??
        (type === "error" ? ERROR_DURATION : DEFAULT_DURATION);
      const id = nextId();

      setToasts((prev) => {
        const next = [...prev, { id, type, message, title: options.title, duration }];
        // Drop the oldest beyond the cap, cancelling their timers.
        const overflow = next.slice(0, Math.max(0, next.length - MAX_VISIBLE));
        overflow.forEach((t) => clearTimers(t.id));
        return next.slice(-MAX_VISIBLE);
      });

      if (duration > 0) {
        const hide = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, [hide]);
      }
      return id;
    },
    [clearTimers, dismiss]
  );

  const success = useCallback(
    (m: string, o?: Omit<ToastOptions, "type">) => toast(m, { ...o, type: "success" }),
    [toast]
  );
  const error = useCallback(
    (m: string, o?: Omit<ToastOptions, "type">) => toast(m, { ...o, type: "error" }),
    [toast]
  );
  const warning = useCallback(
    (m: string, o?: Omit<ToastOptions, "type">) => toast(m, { ...o, type: "warning" }),
    [toast]
  );
  const info = useCallback(
    (m: string, o?: Omit<ToastOptions, "type">) => toast(m, { ...o, type: "info" }),
    [toast]
  );

  // Never leave timers running after the tree unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((list) => list.forEach(clearTimeout));
      pending.clear();
    };
  }, []);

  // Every callback below is stable, so this value never changes identity —
  // showing a toast must not re-render the whole app through this context.
  const value = useMemo(
    () => ({ toast, success, error, warning, info, dismiss }),
    [toast, success, error, warning, info, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/* ---------------------------------------------------------------- viewport */

const TONE: Record<ToastType, { ring: string; icon: string; bar: string }> = {
  success: { ring: "border-success/40", icon: "text-success", bar: "bg-success" },
  error: { ring: "border-danger/45", icon: "text-danger", bar: "bg-danger" },
  warning: { ring: "border-warning/45", icon: "text-warning", bar: "bg-warning" },
  info: { ring: "border-accent/40", icon: "text-accent", bar: "bg-accent" },
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      // pointer-events-none so the empty column never blocks clicks; each
      // card re-enables them for itself.
      className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const tone = TONE[toast.type];
  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border bg-surface/95 shadow-xl shadow-black/40 backdrop-blur ${tone.ring} ${
        toast.leaving ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} aria-hidden />
      <div className="flex items-start gap-3 py-3 pl-4 pr-2.5">
        <span className={`mt-0.5 shrink-0 ${tone.icon}`} aria-hidden>
          <ToastIcon type={toast.type} />
        </span>
        <div className="min-w-0 flex-1">
          {toast.title && (
            <p className="text-sm font-bold text-foreground">{toast.title}</p>
          )}
          <p
            className={`text-sm leading-snug ${
              toast.title ? "mt-0.5 text-muted" : "font-medium text-foreground"
            }`}
          >
            {toast.message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="-mr-0.5 shrink-0 rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-foreground"
          aria-label="Dismiss notification"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  const common = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
  } as const;

  if (type === "success") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.9" />
        <path
          d="m7.8 12.4 2.9 2.9 5.5-6.1"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "error") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.9" />
        <path
          d="M9 9l6 6M15 9l-6 6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === "warning") {
    return (
      <svg {...common}>
        <path
          d="M12 3.6 21 19.4H3L12 3.6Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
        <path
          d="M12 9.4v4.2"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="16.6" r="1.15" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M12 11v5.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7.7" r="1.15" fill="currentColor" />
    </svg>
  );
}
