"use client";

import { useEffect } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="bottom-sheet-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="bottom-sheet-title">
        <div className="bottom-sheet-header">
          <h2 id="bottom-sheet-title" className="bottom-sheet-title">{title}</h2>
          <button
            className="bottom-sheet-close"
            onClick={onClose}
            aria-label="Close filters"
          >
            ×
          </button>
        </div>
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  );
}


