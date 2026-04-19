"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ToastMessage = {
  id: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

let toastListeners: Array<(toast: ToastMessage | null) => void> = [];
let currentToast: ToastMessage | null = null;

export function showToast(message: string, action?: { label: string; onClick: () => void }) {
  const id = Math.random().toString(36).substring(7);
  currentToast = { id, message, action };
  toastListeners.forEach((listener) => listener(currentToast));
  
  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    if (currentToast?.id === id) {
      currentToast = null;
      toastListeners.forEach((listener) => listener(null));
    }
  }, 3000);
}

export default function Toast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const router = useRouter();

  useEffect(() => {
    const listener = (newToast: ToastMessage | null) => {
      setToast(newToast);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  if (!toast) return null;

  const handleAction = () => {
    if (toast.action) {
      toast.action.onClick();
      setToast(null);
    }
  };

  return (
    <div
      className="toast-container"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="toast">
        <span className="toast-message">{toast.message}</span>
        {toast.action && (
          <button
            className="toast-action"
            onClick={handleAction}
            aria-label={toast.action.label}
          >
            {toast.action.label}
          </button>
        )}
        <button
          className="toast-close"
          onClick={() => setToast(null)}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}


