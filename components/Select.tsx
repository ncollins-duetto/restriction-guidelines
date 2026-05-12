"use client";

import { useState, useRef, useEffect } from "react";
import { colors } from "@/lib/tokens";

type SelectProps = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  width?: string | number;
};

function ChevronUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14l5-5 5 5H7z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  );
}

export default function Select({ value, options, onChange, placeholder, width }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = value || placeholder || "";

  return (
    <div ref={ref} className="relative" style={{ width: width ?? "auto", minWidth: "120px" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between gap-2 w-full h-9 px-3 rounded text-[13px]"
        style={{
          border: `1px solid ${open ? colors.primary : colors.border}`,
          backgroundColor: colors.white,
          color: value ? colors.textPrimary : colors.textDisabled,
          outline: "none",
        }}
      >
        <span className="truncate">{displayValue}</span>
        <span className="shrink-0" style={{ color: colors.textSecondary }}>
          {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 z-50 w-full rounded"
          style={{
            top: "calc(100% + 2px)",
            backgroundColor: colors.white,
            border: `1px solid ${colors.border}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            minWidth: "100%",
          }}
        >
          {options.map((opt) => {
            const selected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-[13px] text-left"
                style={{
                  backgroundColor: selected ? colors.primarySubtle : "transparent",
                  color: selected ? colors.primary : colors.textPrimary,
                }}
                onMouseEnter={(e) => {
                  if (!selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.pageBg;
                }}
                onMouseLeave={(e) => {
                  if (!selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
