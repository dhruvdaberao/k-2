"use client";
import React from "react";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="cm-overlay" onClick={onCancel}>
      <div className="cm-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="cm-title">{title}</h2>
        <p className="cm-message">{message}</p>
        <div className="cm-actions">
          <button className="cm-btn cm-btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`cm-btn ${destructive ? "cm-btn--destructive" : "cm-btn--confirm"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style jsx>{`
        .cm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 9999;
          animation: cm-fadeIn 0.15s ease-out;
        }

        @keyframes cm-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes cm-slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .cm-box {
          background: #F5EFE6;
          border-radius: 20px;
          padding: 28px 24px;
          max-width: 380px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          animation: cm-slideUp 0.2s ease-out;
        }

        .cm-title {
          font-size: 19px;
          font-weight: 700;
          color: #3E2C1C;
          margin: 0 0 8px;
          font-family: var(--font-serif, serif);
        }

        .cm-message {
          font-size: 14px;
          color: #8B7355;
          line-height: 1.55;
          margin: 0 0 24px;
        }

        .cm-actions {
          display: flex;
          gap: 10px;
        }

        .cm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 1;
          border: none;
        }

        .cm-btn--cancel {
          background: transparent;
          color: #5A3E2B;
          border: 1.5px solid #D4C4B0;
        }

        .cm-btn--cancel:hover {
          background: #EDE5D8;
        }

        .cm-btn--confirm {
          background: #4A3219;
          color: #fff;
        }

        .cm-btn--confirm:hover {
          background: #3B2814;
        }

        .cm-btn--destructive {
          background: #A33B3B;
          color: #fff;
        }

        .cm-btn--destructive:hover {
          background: #8C2E2E;
        }
      `}</style>
    </div>
  );
}
