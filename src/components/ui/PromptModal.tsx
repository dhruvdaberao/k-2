"use client";
import React, { useState, useEffect } from "react";

type PromptModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  destructive?: boolean;
};

export default function PromptModal({
  isOpen,
  title,
  message,
  placeholder = "Type here...",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
}: PromptModalProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (isOpen) setValue("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="pm-overlay" onClick={onCancel}>
      <div className="pm-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="pm-title">{title}</h2>
        <p className="pm-message">{message}</p>
        
        <input 
          type="text" 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="pm-input"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm(value);
            if (e.key === "Escape") onCancel();
          }}
        />

        <div className="pm-actions">
          <button className="pm-btn pm-btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`pm-btn ${destructive ? "pm-btn--destructive" : "pm-btn--confirm"}`}
            onClick={() => onConfirm(value)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style jsx>{`
        .pm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 9999;
          animation: pm-fadeIn 0.15s ease-out;
        }

        @keyframes pm-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pm-slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .pm-box {
          background: #F5EFE6;
          border-radius: 20px;
          padding: 28px 24px;
          max-width: 380px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          animation: pm-slideUp 0.2s ease-out;
        }

        .pm-title {
          font-size: 19px;
          font-weight: 700;
          color: #3E2C1C;
          margin: 0 0 8px;
          font-family: var(--font-serif, serif);
        }

        .pm-message {
          font-size: 14px;
          color: #8B7355;
          line-height: 1.55;
          margin: 0 0 20px;
        }

        .pm-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1.5px solid #D4C4B0;
          background: white;
          color: #3E2C1C;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 24px;
          outline: none;
          transition: all 0.2s ease;
        }

        .pm-input:focus {
          border-color: #4A3219;
          box-shadow: 0 0 0 3px rgba(74, 50, 25, 0.05);
        }

        .pm-actions {
          display: flex;
          gap: 10px;
        }

        .pm-btn {
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

        .pm-btn--cancel {
          background: transparent;
          color: #5A3E2B;
          border: 1.5px solid #D4C4B0;
        }

        .pm-btn--cancel:hover {
          background: #EDE5D8;
        }

        .pm-btn--confirm {
          background: #4A3219;
          color: #fff;
        }

        .pm-btn--confirm:hover {
          background: #3B2814;
        }

        .pm-btn--destructive {
          background: #A33B3B;
          color: #fff;
        }

        .pm-btn--destructive:hover {
          background: #8C2E2E;
        }
      `}</style>
    </div>
  );
}
