"use client";

import { useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

type RestrictionKey = "CTS" | "CTA" | "CTD" | "MinST" | "MaxST" | "MinSA" | "MaxSA";

type RestrictionDef = {
  key: RestrictionKey;
  label: string;
  hasValue: boolean;
};

const RESTRICTIONS: RestrictionDef[] = [
  { key: "CTS", label: "Closed to Stay", hasValue: false },
  { key: "CTA", label: "Closed to Arrival", hasValue: false },
  { key: "CTD", label: "Closed to Departure", hasValue: false },
  { key: "MinST", label: "Min Stay Thru", hasValue: true },
  { key: "MaxST", label: "Max Stay Thru", hasValue: true },
  { key: "MinSA", label: "Min Stay Arrival", hasValue: true },
  { key: "MaxSA", label: "Max Stay Arrival", hasValue: true },
];

const HOTEL_GROUPS = ["00327803", "B&B Hotels", "Luxury Collection"];
const STRATEGY_FOR_OPTIONS = ["Property", "Segment", "Room Type"];

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#006461">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  );
}

export default function NewRestrictionGuidelineV2Page() {
  const [name, setName] = useState("");
  const [hotelGroup, setHotelGroup] = useState("");
  const [eventName, setEventName] = useState("");
  const [strategyFor, setStrategyFor] = useState("Property");
  const [restrictionValues, setRestrictionValues] = useState<Record<RestrictionKey, string>>(
    Object.fromEntries(RESTRICTIONS.map((r) => [r.key, ""])) as Record<RestrictionKey, string>
  );
  const [checkedRestrictions, setCheckedRestrictions] = useState<Record<RestrictionKey, boolean>>(
    Object.fromEntries(RESTRICTIONS.map((r) => [r.key, false])) as Record<RestrictionKey, boolean>
  );
  const [removeAll, setRemoveAll] = useState(false);

  const anyRestrictionChecked = Object.values(checkedRestrictions).some(Boolean);

  function toggleRestriction(key: RestrictionKey) {
    setCheckedRestrictions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
    if (!checkedRestrictions[key]) {
      setRemoveAll(false);
    }
  }

  function toggleRemoveAll() {
    if (!anyRestrictionChecked) {
      setRemoveAll((prev) => !prev);
    }
  }

  function setRestrictionValue(key: RestrictionKey, value: string) {
    setRestrictionValues((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit = name.trim() && hotelGroup && (anyRestrictionChecked || removeAll);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        breadcrumb={["Home", "Pricing & Strategy", "Restriction Guidelines (Alt)", "New"]}
      />

      <div className="flex flex-col flex-1 px-8 py-6 max-w-2xl">
        {/* Page title row */}
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-[22px] font-bold flex-1" style={{ color: "#1a2533" }}>
            New Restriction Guideline
          </h1>
          <Link
            href="/restrictions-alt"
            className="px-4 h-8 flex items-center rounded border text-[13px] font-semibold hover:bg-gray-50"
            style={{ borderColor: "#9aa5ab", color: "#4f5b60" }}
          >
            Cancel
          </Link>
          <button
            disabled={!canSubmit}
            className="px-5 h-8 rounded text-[13px] font-semibold"
            style={
              canSubmit
                ? { backgroundColor: "#006461", color: "#ffffff" }
                : { backgroundColor: "#dde1e2", color: "#9aa5ab", cursor: "not-allowed" }
            }
          >
            Create
          </button>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-6">
          {/* Name */}
          <FormRow label="Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 px-3 rounded border text-[13px] outline-none w-full max-w-xs"
              style={{ borderColor: "#9aa5ab", color: "#1a2533" }}
            />
          </FormRow>

          {/* Enterprise Hotel Group */}
          <FormRow label="Enterprise Hotel Group" required>
            <div className="relative w-full max-w-xs">
              <select
                value={hotelGroup}
                onChange={(e) => setHotelGroup(e.target.value)}
                className="h-9 px-3 pr-8 rounded border text-[13px] outline-none w-full appearance-none"
                style={{
                  borderColor: "#9aa5ab",
                  color: hotelGroup ? "#1a2533" : "#9aa5ab",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="" disabled>Select...</option>
                {HOTEL_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "#4f5b60" }}>
                <ChevronDownIcon />
              </span>
            </div>
          </FormRow>

          {/* Event Name */}
          <FormRow label="Event Name">
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Optional"
              className="h-9 px-3 rounded border text-[13px] outline-none w-full max-w-xs"
              style={{ borderColor: "#9aa5ab", color: "#1a2533" }}
            />
          </FormRow>

          {/* Stay Date */}
          <FormRow label="Stay Date">
            <button
              className="text-[13px] font-semibold hover:underline"
              style={{ color: "#006461" }}
            >
              Everyday
            </button>
          </FormRow>

          {/* Criteria */}
          <FormRow label="Criteria">
            <button
              className="text-[13px] font-semibold hover:underline"
              style={{ color: "#006461" }}
            >
              None
            </button>
          </FormRow>

          {/* Set Strategy For */}
          <FormRow label="Set Strategy For">
            <div className="relative w-full max-w-xs">
              <select
                value={strategyFor}
                onChange={(e) => setStrategyFor(e.target.value)}
                className="h-9 px-3 pr-8 rounded border text-[13px] outline-none w-full appearance-none"
                style={{ borderColor: "#9aa5ab", color: "#1a2533", backgroundColor: "#ffffff" }}
              >
                {STRATEGY_FOR_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "#4f5b60" }}>
                <ChevronDownIcon />
              </span>
            </div>
          </FormRow>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: "#eeeeee" }} />

          {/* Restriction checkboxes */}
          <div className="flex flex-col gap-4">
            {RESTRICTIONS.map((r) => (
              <RestrictionRow
                key={r.key}
                def={r}
                checked={checkedRestrictions[r.key]}
                value={restrictionValues[r.key]}
                onToggle={() => toggleRestriction(r.key)}
                onValueChange={(v) => setRestrictionValue(r.key, v)}
              />
            ))}

            {/* Remove all restrictions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ marginLeft: "180px" }}>
                <input
                  type="checkbox"
                  id="remove-all"
                  checked={removeAll}
                  onChange={toggleRemoveAll}
                  disabled={anyRestrictionChecked}
                  className="w-4 h-4 accent-[#006461]"
                  style={{ opacity: anyRestrictionChecked ? 0.4 : 1 }}
                />
                <label
                  htmlFor="remove-all"
                  className="text-[13px] cursor-pointer"
                  style={{ color: anyRestrictionChecked ? "#9aa5ab" : "#1a2533" }}
                >
                  Remove all restrictions
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="text-right shrink-0 pt-2" style={{ width: "180px" }}>
        <span className="text-[13px] font-semibold" style={{ color: "#1a2533" }}>
          {label}
          {required && <span style={{ color: "#c0392b" }}> *</span>}
        </span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function RestrictionRow({
  def,
  checked,
  value,
  onToggle,
  onValueChange,
}: {
  def: { key: RestrictionKey; label: string; hasValue: boolean };
  checked: boolean;
  value: string;
  onToggle: () => void;
  onValueChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {/* Label + info icon — right-aligned in 180px column */}
      <div className="flex items-center justify-end gap-1.5 shrink-0" style={{ width: "180px" }}>
        <span className="text-[13px] font-semibold" style={{ color: "#1a2533" }}>
          {def.label}
        </span>
        <span title={`${def.label} restriction`}>
          <InfoIcon />
        </span>
      </div>

      {/* Checkbox or input */}
      {def.hasValue ? (
        <input
          type="number"
          min={0}
          max={99}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if ([",", ".", "-", "e", "E"].includes(e.key)) e.preventDefault();
          }}
          placeholder=""
          className="w-16 h-8 px-2 rounded border text-[13px] text-center outline-none"
          style={{ borderColor: "#9aa5ab", color: "#1a2533" }}
        />
      ) : (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="w-4 h-4 accent-[#006461]"
        />
      )}
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  );
}
