"use client";

import { useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { colors } from "@/lib/tokens";
import type { RestrictionType } from "@/lib/types";
import { RESTRICTIONS, NEW_FORM_HOTEL_GROUPS, STRATEGY_FOR_OPTIONS } from "@/lib/data";

type RestrictionKey = RestrictionType;

const STAY_DATE_OPTIONS = ["Active Day of Week", "Active Date Range", "Seasonal Date Range"];
const CRITERIA_OPTIONS = ["Days Before Arrival", "Committed Occupancy", "Demand Occupancy", "OTB"];
const OPERATORS = ["Less than", "Less than or equal to", "Greater than", "Greater than or equal to", "Equal to"];
const PROPERTY_OPTIONS = ["Property", "Room Type", "Segment"];
const UNIT_OPTIONS = ["%", "Rooms"];
const ON_DAY_OPTIONS = ["Current Day", "Yesterday", "2 Days Ago"];

type CriteriaVal = { operator: string; value: string; property: string; unit: string; onDay: string };
const DEFAULT_CRITERIA_VAL: CriteriaVal = { operator: "Equal to", value: "0", property: "Property", unit: "%", onDay: "Current Day" };

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
type DayKey = (typeof DAY_KEYS)[number];
const DEFAULT_DAYS: Record<DayKey, boolean> = { Sun: true, Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true };

// ─── Icons ────────────────────────────────────────────────────────────────────

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={colors.primary}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewRestrictionGuidelinePage() {
  const [name, setName] = useState("");
  const [hotelGroup, setHotelGroup] = useState("");
  const [strategyFor, setStrategyFor] = useState("Property");
  const [restrictionValues, setRestrictionValues] = useState<Record<RestrictionKey, string>>(
    Object.fromEntries(RESTRICTIONS.map((r) => [r.key, ""])) as Record<RestrictionKey, string>
  );
  const [checkedRestrictions, setCheckedRestrictions] = useState<Record<RestrictionKey, boolean>>(
    Object.fromEntries(RESTRICTIONS.map((r) => [r.key, false])) as Record<RestrictionKey, boolean>
  );

  // Stay Date
  const [stayDateModalOpen, setStayDateModalOpen] = useState(false);
  const [stayDateConditions, setStayDateConditions] = useState<string[]>([]);
  const [pendingStayDates, setPendingStayDates] = useState<string[]>([]);
  const [stayDateDays, setStayDateDays] = useState<Record<string, Record<DayKey, boolean>>>({});
  const [stayDateRanges, setStayDateRanges] = useState<Record<string, { start: string; end: string }>>({});

  // Criteria
  const [criteriaModalOpen, setCriteriaModalOpen] = useState(false);
  const [criteriaConditions, setCriteriaConditions] = useState<string[]>([]);
  const [pendingCriteria, setPendingCriteria] = useState<string[]>([]);
  const [criteriaValues, setCriteriaValues] = useState<Record<string, CriteriaVal>>({});

  const anyRestrictionChecked = Object.values(checkedRestrictions).some(Boolean);
  const canSubmit =
    name.trim() &&
    hotelGroup &&
    (anyRestrictionChecked || Object.values(restrictionValues).some(Boolean));

  function toggleRestriction(key: RestrictionKey) {
    setCheckedRestrictions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setRestrictionValue(key: RestrictionKey, value: string) {
    setRestrictionValues((prev) => ({ ...prev, [key]: value }));
  }

  function togglePending(val: string, pending: string[], set: (v: string[]) => void) {
    set(pending.includes(val) ? pending.filter((v) => v !== val) : [...pending, val]);
  }

  function openStayDateModal() {
    setPendingStayDates([...stayDateConditions]);
    setStayDateModalOpen(true);
  }

  function confirmStayDates() {
    const newDays = { ...stayDateDays };
    const newRanges = { ...stayDateRanges };
    for (const c of pendingStayDates) {
      if (c === "Active Day of Week" && !newDays[c]) newDays[c] = { ...DEFAULT_DAYS };
      else if (!newDays[c] && !newRanges[c]) newRanges[c] = { start: "", end: "" };
    }
    setStayDateDays(newDays);
    setStayDateRanges(newRanges);
    setStayDateConditions([...pendingStayDates]);
    setStayDateModalOpen(false);
  }

  function removeStayDate(cond: string) {
    setStayDateConditions((prev) => prev.filter((c) => c !== cond));
    setStayDateDays((prev) => { const n = { ...prev }; delete n[cond]; return n; });
    setStayDateRanges((prev) => { const n = { ...prev }; delete n[cond]; return n; });
  }

  function openCriteriaModal() {
    setPendingCriteria([...criteriaConditions]);
    setCriteriaModalOpen(true);
  }

  function confirmCriteria() {
    const newVals = { ...criteriaValues };
    for (const c of pendingCriteria) {
      if (!newVals[c]) newVals[c] = { ...DEFAULT_CRITERIA_VAL };
    }
    setCriteriaValues(newVals);
    setCriteriaConditions([...pendingCriteria]);
    setCriteriaModalOpen(false);
  }

  function removeCriteria(cond: string) {
    setCriteriaConditions((prev) => prev.filter((c) => c !== cond));
    setCriteriaValues((prev) => { const n = { ...prev }; delete n[cond]; return n; });
  }

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      <AppHeader breadcrumb={["Home", "Pricing & Strategy", "Restriction Guidelines", "New"]} />

      {/* Fixed page title */}
      <div
        className="shrink-0 flex items-center px-8 py-4 border-b"
        style={{ backgroundColor: colors.surfaceBg, borderColor: colors.border }}
      >
        <h1 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>
          New Restriction Guideline
        </h1>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-8 py-6" style={{ backgroundColor: colors.surfaceBg }}>
        <div className="flex flex-col gap-5" style={{ maxWidth: "960px" }}>

          {/* Top fields — constrained width */}
          <div className="flex flex-col gap-5" style={{ maxWidth: "400px" }}>

            {/* Name */}
            <FormField label="Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 px-[10px] rounded text-[13px] outline-none w-full"
                style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.white }}
              />
            </FormField>

            {/* Enterprise Hotel Group */}
            <FormField label="Enterprise Hotel Group" required>
              <div className="relative">
                <select
                  value={hotelGroup}
                  onChange={(e) => setHotelGroup(e.target.value)}
                  className="h-9 px-[10px] pr-8 rounded text-[13px] outline-none w-full appearance-none"
                  style={{
                    border: `1px solid ${colors.border}`,
                    color: hotelGroup ? colors.textPrimary : colors.textDisabled,
                    backgroundColor: colors.white,
                  }}
                >
                  <option value="" disabled>Select...</option>
                  {NEW_FORM_HOTEL_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: colors.textSecondary }}>
                  <ChevronDownIcon />
                </span>
              </div>
            </FormField>

          </div>

          <div className="border-t" style={{ borderColor: colors.border }} />

          {/* Stay Date */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px]" style={{ color: colors.textSecondary }}>Stay Date</span>
              <button className="text-[13px]" style={{ color: colors.primary }} onClick={openStayDateModal}>
                Add conditions
              </button>
            </div>
            {stayDateConditions.length === 0 ? (
              <span className="text-[17px] font-bold" style={{ color: colors.textPrimary }}>Everyday</span>
            ) : (
              <div className="flex flex-col gap-4">
                {stayDateConditions.map((cond) => (
                  <div key={cond} className="flex items-center gap-3 flex-wrap">
                    <ConditionChip label={cond} onRemove={() => removeStayDate(cond)} />
                    <span className="text-[13px]" style={{ color: colors.textSecondary }}>is</span>
                    {cond === "Active Day of Week" ? (
                      <DayOfWeekControl
                        days={stayDateDays[cond] ?? { ...DEFAULT_DAYS }}
                        onChange={(d) => setStayDateDays((prev) => ({ ...prev, [cond]: d }))}
                      />
                    ) : (
                      <DateRangeControl
                        start={stayDateRanges[cond]?.start ?? ""}
                        end={stayDateRanges[cond]?.end ?? ""}
                        onStartChange={(v) => setStayDateRanges((prev) => ({ ...prev, [cond]: { ...prev[cond], start: v } }))}
                        onEndChange={(v) => setStayDateRanges((prev) => ({ ...prev, [cond]: { ...prev[cond], end: v } }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t" style={{ borderColor: colors.border }} />

          {/* Criteria */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px]" style={{ color: colors.textSecondary }}>Criteria</span>
              <button className="text-[13px]" style={{ color: colors.primary }} onClick={openCriteriaModal}>
                Add conditions
              </button>
            </div>
            {criteriaConditions.length === 0 ? (
              <span className="text-[17px] font-bold" style={{ color: colors.textPrimary }}>Always</span>
            ) : (
              <div className="flex flex-col gap-4">
                {criteriaConditions.map((cond) => (
                  <div key={cond} className="flex items-center gap-3 flex-wrap">
                    <div style={{ minWidth: "220px" }}>
                      <ConditionChip label={cond} onRemove={() => removeCriteria(cond)} />
                    </div>
                    <span className="text-[13px]" style={{ color: colors.textSecondary }}>is</span>
                    <CriteriaControl
                      criteriaType={cond}
                      val={criteriaValues[cond] ?? { ...DEFAULT_CRITERIA_VAL }}
                      onChange={(patch) => setCriteriaValues((prev) => ({ ...prev, [cond]: { ...(prev[cond] ?? DEFAULT_CRITERIA_VAL), ...patch } }))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t" style={{ borderColor: colors.border }} />

          {/* Set Strategy For */}
          <FormField label="Set Strategy For">
            <div className="relative" style={{ maxWidth: "200px" }}>
              <select
                value={strategyFor}
                onChange={(e) => setStrategyFor(e.target.value)}
                className="h-9 px-[10px] pr-8 rounded text-[13px] outline-none w-full appearance-none"
                style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.white }}
              >
                {STRATEGY_FOR_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: colors.textSecondary }}>
                <ChevronDownIcon />
              </span>
            </div>
          </FormField>

          <div className="border-t" style={{ borderColor: colors.border }} />

          {/* Set Restrictions */}
          <div className="flex flex-col gap-3">
            <span className="text-[13px]" style={{ color: colors.textSecondary }}>Set Restrictions</span>
            <div className="flex flex-col gap-6">
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
            </div>
          </div>

        </div>
      </div>

      {/* Fixed footer */}
      <div
        className="shrink-0 flex items-center gap-3 px-8 py-4 border-t"
        style={{ backgroundColor: colors.pageBg, borderColor: colors.border }}
      >
        <button
          disabled={!canSubmit}
          className="px-5 h-9 rounded text-[14px]"
          style={canSubmit
            ? {
                backgroundColor: colors.primary,
                color: colors.white,
                fontWeight: 200,
                boxShadow: "0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)",
              }
            : {
                backgroundColor: "hsl(0 0% 93%)",
                color: "hsl(0 0% 62%)",
                cursor: "not-allowed",
                fontWeight: 200,
              }}
        >
          Create
        </button>
        <Link
          href="/restrictions"
          className="px-5 h-9 flex items-center rounded text-[14px]"
          style={{
            backgroundColor: colors.white,
            border: `1px solid ${colors.primary}`,
            color: colors.primary,
            fontWeight: 200,
            boxShadow: "0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)",
          }}
        >
          Cancel
        </Link>
      </div>

      {/* Stay Date modal */}
      <ConditionModal
        open={stayDateModalOpen}
        title="Add Stay Date Conditions"
        options={STAY_DATE_OPTIONS}
        pending={pendingStayDates}
        onToggle={(v) => togglePending(v, pendingStayDates, setPendingStayDates)}
        onCancel={() => setStayDateModalOpen(false)}
        onAdd={confirmStayDates}
      />

      {/* Criteria modal */}
      <ConditionModal
        open={criteriaModalOpen}
        title="Add Criteria Conditions"
        options={CRITERIA_OPTIONS}
        pending={pendingCriteria}
        onToggle={(v) => togglePending(v, pendingCriteria, setPendingCriteria)}
        onCancel={() => setCriteriaModalOpen(false)}
        onAdd={confirmCriteria}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px]" style={{ color: colors.textSecondary }}>
        {label}{required && <span style={{ color: colors.error }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function RestrictionRow({
  def, checked, value, onToggle, onValueChange,
}: {
  def: { key: RestrictionKey; label: string; hasValue: boolean };
  checked: boolean;
  value: string;
  onToggle: () => void;
  onValueChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-end gap-1.5 shrink-0" style={{ width: "160px" }}>
        <span className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>{def.label}</span>
        <span title={`${def.label} info`}><InfoIcon /></span>
      </div>
      {def.hasValue ? (
        <input
          type="number"
          min={0}
          max={99}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => { if ([",", ".", "-", "e", "E"].includes(e.key)) e.preventDefault(); }}
          className="w-24 h-9 px-3 rounded text-[13px] outline-none"
          style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.white }}
        />
      ) : (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="w-4 h-4"
          style={{ accentColor: colors.primary }}
        />
      )}
    </div>
  );
}

function ConditionChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div
      className="flex items-center justify-between gap-1.5 px-3 py-1 rounded-full text-[13px] w-full"
      style={{ backgroundColor: colors.primarySubtle, color: colors.primary, border: `1px solid ${colors.primary}` }}
    >
      <span>{label}</span>
      <button onClick={onRemove} className="flex items-center" style={{ color: colors.primary }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  );
}

function DayOfWeekControl({ days, onChange }: { days: Record<DayKey, boolean>; onChange: (d: Record<DayKey, boolean>) => void }) {
  return (
    <div className="flex items-end gap-3">
      {DAY_KEYS.map((day) => (
        <label key={day} className="flex flex-col items-center gap-1 cursor-pointer">
          <span className="text-[11px]" style={{ color: colors.textSecondary }}>{day}</span>
          <input
            type="checkbox"
            checked={days[day]}
            onChange={() => onChange({ ...days, [day]: !days[day] })}
            className="w-4 h-4"
            style={{ accentColor: colors.primary }}
          />
        </label>
      ))}
    </div>
  );
}

function DateRangeControl({ start, end, onStartChange, onEndChange }: {
  start: string; end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 h-9 rounded text-[13px]"
      style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.white }}
    >
      <input
        type="date"
        value={start}
        onChange={(e) => onStartChange(e.target.value)}
        className="outline-none bg-transparent text-[13px]"
        style={{ color: colors.textPrimary }}
      />
      <span style={{ color: colors.textSecondary }}>–</span>
      <input
        type="date"
        value={end}
        onChange={(e) => onEndChange(e.target.value)}
        className="outline-none bg-transparent text-[13px]"
        style={{ color: colors.textPrimary }}
      />
    </div>
  );
}

function SelectInput({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-3 pr-7 rounded text-[13px] outline-none appearance-none"
        style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.white }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" style={{ color: colors.textSecondary }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5H7z" /></svg>
      </span>
    </div>
  );
}

function CriteriaControl({ criteriaType, val, onChange }: {
  criteriaType: string;
  val: CriteriaVal;
  onChange: (patch: Partial<CriteriaVal>) => void;
}) {
  const isDaysBeforeArrival = criteriaType === "Days Before Arrival";

  if (isDaysBeforeArrival) {
    return (
      <div className="flex items-center gap-2">
        <SelectInput value={val.operator} options={OPERATORS} onChange={(v) => onChange({ operator: v })} />
        <input
          type="number"
          value={val.value}
          onChange={(e) => onChange({ value: e.target.value })}
          className="w-20 h-9 px-3 rounded text-[13px] outline-none"
          style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.white }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[13px]" style={{ color: colors.textSecondary }}>for</span>
      <SelectInput value={val.property} options={PROPERTY_OPTIONS} onChange={(v) => onChange({ property: v })} />
      <SelectInput value={val.operator} options={OPERATORS} onChange={(v) => onChange({ operator: v })} />
      <input
        type="number"
        value={val.value}
        onChange={(e) => onChange({ value: e.target.value })}
        className="w-20 h-9 px-3 rounded text-[13px] outline-none"
        style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.white }}
      />
      <SelectInput value={val.unit} options={UNIT_OPTIONS} onChange={(v) => onChange({ unit: v })} />
      <span className="text-[13px]" style={{ color: colors.textSecondary }}>on</span>
      <SelectInput value={val.onDay} options={ON_DAY_OPTIONS} onChange={(v) => onChange({ onDay: v })} />
      <span title="Info"><InfoIcon /></span>
    </div>
  );
}

function ConditionModal({ open, title, options, pending, onToggle, onCancel, onAdd }: {
  open: boolean;
  title: string;
  options: string[];
  pending: string[];
  onToggle: (v: string) => void;
  onCancel: () => void;
  onAdd: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full mx-6 flex flex-col"
        style={{ maxWidth: "480px", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>{title}</h2>
          <button onClick={onCancel} style={{ color: colors.textSecondary }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-3">
          {options.map((opt) => {
            const selected = pending.includes(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-3 px-4 py-3 rounded cursor-pointer"
                style={{ border: `1px solid ${selected ? colors.primary : colors.border}` }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggle(opt)}
                  className="w-4 h-4"
                  style={{ accentColor: colors.primary }}
                />
                <span className="text-[14px]" style={{ color: selected ? colors.textPrimary : colors.textSecondary }}>
                  {opt}
                </span>
              </label>
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-4 px-6 py-4 border-t" style={{ borderColor: colors.border }}>
          <button onClick={onCancel} className="text-[13px] font-semibold" style={{ color: colors.primary }}>
            Cancel
          </button>
          <button
            onClick={onAdd}
            className="px-5 h-9 rounded text-[13px] font-semibold"
            style={{ backgroundColor: colors.primary, color: colors.white }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
