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
          {cancelLabel && (
            <button className="cm-btn cm-btn--cancel" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
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
          background: rgba(0, 0, 0, 0.5);
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
          background: #FDFBF7;
          border-radius: 16px;
          border: 1px solid #C4A484;
          padding: 24px;
          max-width: 448px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: cm-slideUp 0.2s ease-out;
          font-family: inherit;
        }

        .cm-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: #4A3219;
          margin: 0 0 8px;
        }

        .cm-message {
          font-size: 1rem;
          color: #8B7355;
          line-height: 1.5;
          margin: 0 0 24px;
        }

        .cm-actions {
          display: flex;
          gap: 16px;
        }

        .cm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 50px;
          font-size: 1rem;
          font-weight: bold;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 1;
          border: none;
          outline: none;
        }

        .cm-btn--cancel {
          background: transparent;
          color: #4A3219;
          border: 1px solid #C4A484;
        }

        .cm-btn--cancel:hover {
          background: #F5EFE6;
          border-color: #8B7355;
        }

        .cm-btn--confirm {
          background: #4A3219;
          color: #fff;
        }

        .cm-btn--confirm:hover {
          background: #3B2814;
        }

        .cm-btn--destructive {
          background: #C84C35;
          color: #fff;
        }

        .cm-btn--destructive:hover {
          background: #A93B26;
        }
      `}</style>
    </div>
  );
}
