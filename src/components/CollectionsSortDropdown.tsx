"use client";

import { useEffect, useRef, useState } from "react";

type SortOption = "default" | "newest" | "price-low" | "price-high";

const OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "default", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

export default function CollectionsSortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selected = OPTIONS.find((option) => option.value === value) ?? OPTIONS[0];

  return (
    <div className={`collections-sort ${open ? "is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="collections-sort__trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="collections-sort__label">{selected.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="collections-sort__chevron"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div className="collections-sort__menu" role="listbox" aria-label="Sort products">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={value === option.value}
            className={`collections-sort__option ${value === option.value ? "is-selected" : ""}`}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
