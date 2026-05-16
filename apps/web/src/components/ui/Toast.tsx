"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

export type ToastVariant = "alert" | "status";

interface ToastItem {
  readonly id: string;
  readonly message: string;
  readonly variant: ToastVariant;
}

interface ToastContextValue {
  readonly toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, variant: ToastVariant = "status") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div aria-live="polite">
        {toasts
          .filter((t) => t.variant === "status")
          .map((t) => (
            <div key={t.id} role="status">
              {t.message}
            </div>
          ))}
      </div>
      <div aria-live="assertive">
        {toasts
          .filter((t) => t.variant === "alert")
          .map((t) => (
            <div key={t.id} role="alert">
              {t.message}
            </div>
          ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function useOptionalToast(): ToastContextValue | null {
  return useContext(ToastContext);
}
