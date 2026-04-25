"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import Toast from "@/components/ui/Toast";

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let globalShowToast: (message: string) => void = () => {};

export const showToast = (message: string) => {
  globalShowToast(message);
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState({ show: false, message: "" });

  const triggerToast = (message: string) => {
    setToast({ show: true, message });
  };

  globalShowToast = triggerToast;

  const hideToast = () => {
    setToast({ show: false, message: "" });
  };

  return (
    <ToastContext.Provider value={{ showToast: triggerToast }}>
      {children}
      <Toast
        message={toast.message}
        show={toast.show}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
