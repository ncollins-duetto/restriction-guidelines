"use client";

import { useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof DAYS)[number];

type RestrictionKey = "CTS" | "CTA" | "CTD" | "MinSA" | "MinST" | "MaxSA" | "MaxST";

type RestrictionDef = {
  key: RestrictionKey;
  label: string;
  hasValue: boolean;
  conflicts: RestrictionKey[];
};

const RESTRICTIONS: RestrictionDef[] = [
  { key: "CTS", label: "Close to Stay", hasValue: false, conflicts: ["CTA", "CTD", "MinSA", "MinST", "MaxSA", "MaxST"] },
  { key: "CTA", label: "Close to Arrival", hasValue: false, conflicts: ["CTS", "MinSA", "MaxSA"] },
  { key: "CTD", label: "Close to Departure", hasValue: false, conflicts: ["CTS"] },
  { key: "MinSA", label: "Min Stay Arrival", hasValue: true, conflicts: ["CTA", "CTS"] },
  { key: "MinST", label: "Min Stay Thru", hasValue: false, conflicts: ["CTS"] },
  { key: "MaxSA", label: "Max Stay Arrival", hasValue: true, conflicts: ["CTA", "CTS"] },
  { key: "MaxST", label: "Max Stay Thru", hasValue: false, conflicts: ["CTS"] },
];

const SEGMENTS = ["All Segments", "Corporate", "Leisure", "OTA", "Government", "Group"];
const ROOM_TYPES = ["All Room Types", "Standard", "Deluxe", "Suite", "Junior Suite", "Penthouse"];

type RestrictionState = {
  checked: boolean;
  value: string;
};

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
    </svg>
  );
}

export default function NewRestrictionV2Page() {
  const [name, setName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [days, setDays] = useState<Day[]>([]);
  const [segments, setSegments] = useState<string[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<Record<RestrictionKey, RestrictionState>>(() =>
    Object.fromEntries(
      RESTRICTIONS.map((r) => [r.key, { checked: false, value: "" }])
    ) as Record<RestrictionKey, RestrictionState>
  );

  function toggleDay(day: Day) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleAllDays() {
    setDays((prev) => (prev.length === DAYS.length ? [] : [...DAYS]));
  }

  function toggleSegment(s: string) {
    if (s === "All Segments") {
      setSegments((prev) => (prev.includes("All Segments") ? [] : ["All Segments"]));
      return;
    }
    setSegments((prev) => {
      const without = prev.filter((x) => x !== "All Segments");
      return without.includes(s) ? without.filter((x) => x !== s) : [...without, s];
    });
  }

  function toggleRoomType(rt: string) {
    if (rt === "All Room Types") {
      setRoomTypes((prev) => (prev.includes("All Room Types") ? [] : ["All Room Types"]));
      return;
    }
    setRoomTypes((prev) => {
      const without = prev.filter((x) => x !== "All Room Types");
      return without.includes(rt) ? without.filter((x) => x !== rt) : [...without, rt];
    });
  }

  function getConflictingKeys(key: RestrictionKey): RestrictionKey[] {
    const def = RESTRICTIONS.find((r) => r.key === key);
    return def?.conflicts ?? [];
  }

  function isDisabled(key: RestrictionKey): boolean {
    return RESTRICTIONS.some(
      (r) => restrictions[r.key].checked && r.conflicts.includes(key)
    );
  }

  function toggleRestriction(key: RestrictionKey) {
    setRestrictions((prev) => {
      const next = { ...prev };
      const nowChecked = !prev[key].checked;
      next[key] = { ...prev[key], checked: nowChecked };
      if (nowChecked) {
        for (const conflictKey of getConflictingKeys(key)) {
          next[conflictKey] = { ...next[conflictKey], checked: false, value: "" };
        }
      }
      return next;
    });
  }

  function setRestrictionValue(key: RestrictionKey, value: string) {
    setRestrictions((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  }

  const checkedCount = Object.values(restrictions).filter((r) => r.checked).length;
  const canSubmit = name.trim() && dateFrom && dateTo && days.length > 0 && segments.length > 0 && checkedCount > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        breadcrumb={["Home", "Pricing & Strategy", "Restriction Guidelines V2", "New Rule"]}
      />

      <div className="flex flex-col flex-1 px-6 py-5 max-w-5xl">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/restrictions-v2"
            className="flex items-center gap-1 text-[13px] hover:underline"
            style={{ color: "#006461" }}
          >
            <ChevronLeftIcon />
            Back
          </Link>
          <span style={{ color: "#dde1e2" }}>|</span>
          <h1 className="text-[18px] font-bold" style={{ color: "#1a2533" }}>
            New Restriction Rule
          </h1>
        </div>

        {/* Rule name */}
        <div className="mb-6">
          <label className="block text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#4f5b60" }}>
            Rule Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Weekend Min Stay"
            className="w-full max-w-sm h-9 px-3 rounded border text-[13px] outline-none focus:ring-2"
            style={{
              borderColor: "#dde1e2",
              color: "#1a2533",
            }}
          />
        </div>

        {/* Two-column form */}
        <div className="flex gap-8">
          {/* Left: Selection criteria */}
          <div className="flex flex-col gap-6 w-[340px] shrink-0">
            <SectionLabel>Criteria</SectionLabel>

            {/* Date range */}
            <div>
              <FieldLabel>Date Range</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 px-3 rounded border text-[13px] outline-none focus:ring-2"
                  style={{ borderColor: "#dde1e2", color: "#1a2533" }}
                />
                <span className="text-[13px]" style={{ color: "#4f5b60" }}>to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 px-3 rounded border text-[13px] outline-none focus:ring-2"
                  style={{ borderColor: "#dde1e2", color: "#1a2533" }}
                />
              </div>
            </div>

            {/* Days of week */}
            <div>
              <FieldLabel>Days of Week</FieldLabel>
              <div className="flex items-center gap-2 flex-wrap">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className="w-9 h-9 rounded-full text-[12px] font-bold transition-colors"
                    style={
                      days.includes(day)
                        ? { backgroundColor: "#006461", color: "#ffffff" }
                        : { backgroundColor: "#f0f0f0", color: "#4f5b60" }
                    }
                  >
                    {day[0]}
                  </button>
                ))}
                <button
                  onClick={toggleAllDays}
                  className="px-3 h-9 rounded text-[12px] font-bold transition-colors"
                  style={
                    days.length === DAYS.length
                      ? { backgroundColor: "#006461", color: "#ffffff" }
                      : { backgroundColor: "#f0f0f0", color: "#4f5b60" }
                  }
                >
                  All
                </button>
              </div>
            </div>

            {/* Segments */}
            <div>
              <FieldLabel>Segments</FieldLabel>
              <div className="flex flex-col gap-1.5">
                {SEGMENTS.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={segments.includes(s)}
                      onChange={() => toggleSegment(s)}
                    />
                    <span className="text-[13px]" style={{ color: "#1a2533" }}>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Room Types */}
            <div>
              <FieldLabel>Room Types</FieldLabel>
              <div className="flex flex-col gap-1.5">
                {ROOM_TYPES.map((rt) => (
                  <label key={rt} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={roomTypes.includes(rt)}
                      onChange={() => toggleRoomType(rt)}
                    />
                    <span className="text-[13px]" style={{ color: "#1a2533" }}>{rt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch" style={{ backgroundColor: "#dde1e2" }} />

          {/* Right: Restriction types */}
          <div className="flex flex-col gap-6 flex-1">
            <SectionLabel>Restrictions</SectionLabel>

            <div className="flex flex-col gap-3">
              {RESTRICTIONS.map((r) => {
                const state = restrictions[r.key];
                const disabled = !state.checked && isDisabled(r.key);
                return (
                  <div
                    key={r.key}
                    className="flex items-center gap-3 py-2 px-3 rounded"
                    style={{
                      backgroundColor: state.checked ? "#f0f8f7" : "transparent",
                      opacity: disabled ? 0.4 : 1,
                    }}
                  >
                    <Checkbox
                      checked={state.checked}
                      onChange={() => !disabled && toggleRestriction(r.key)}
                      disabled={disabled}
                    />
                    <span
                      className="text-[13px] w-32"
                      style={{ color: "#1a2533" }}
                    >
                      {r.label}
                    </span>
                    <span
                      className="text-[11px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "#dce8f5", color: "#1e3a5f" }}
                    >
                      {r.key}
                    </span>
                    {r.hasValue && state.checked && (
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-[12px]" style={{ color: "#4f5b60" }}>Nights:</span>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          step={1}
                          value={state.value}
                          onChange={(e) => setRestrictionValue(r.key, e.target.value)}
                          onKeyDown={(e) => {
                            if ([",", ".", "-", "e", "E"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          className="w-16 h-8 px-2 rounded border text-[13px] text-center outline-none"
                          style={{ borderColor: "#dde1e2", color: "#1a2533" }}
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {checkedCount > 0 && (
              <p className="text-[12px]" style={{ color: "#4f5b60" }}>
                Grayed-out restrictions conflict with your current selection.
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center justify-end gap-3 mt-8 pt-5 border-t"
          style={{ borderColor: "#dde1e2" }}
        >
          <Link
            href="/restrictions-v2"
            className="px-5 h-9 flex items-center rounded border text-[13px] font-bold transition-colors hover:bg-gray-50"
            style={{ borderColor: "#dde1e2", color: "#4f5b60" }}
          >
            Cancel
          </Link>
          <button
            disabled={!canSubmit}
            className="px-5 h-9 rounded text-[13px] font-bold transition-colors"
            style={
              canSubmit
                ? { backgroundColor: "#006461", color: "#ffffff" }
                : { backgroundColor: "#dde1e2", color: "#9aa5ab", cursor: "not-allowed" }
            }
          >
            Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#4f5b60" }}>
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-bold mb-2" style={{ color: "#1a2533" }}>
      {children}
    </label>
  );
}

function Checkbox({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
      style={
        checked
          ? { backgroundColor: "#006461", borderColor: "#006461" }
          : { backgroundColor: "#ffffff", borderColor: "#9aa5ab" }
      }
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
