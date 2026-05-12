"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import SelectInput from "@/components/Select";
import { colors } from "@/lib/tokens";
import type { RestrictionType } from "@/lib/types";
import {
  RESTRICTIONS,
  HOTEL_GROUPS,
  STRATEGY_FOR_OPTIONS,
  YIELD_SEGMENTS,
  FORM_ROOM_TYPES,
  MOCK_PROPERTIES_BY_GROUP,
} from "@/lib/data";

type RestrictionKey = RestrictionType;

const STAY_DATE_OPTIONS = ["Active Day of Week", "Active Date Range", "Seasonal Date Range"];
const DATE_RANGE_EXCLUSIVE = ["Active Date Range", "Seasonal Date Range"];
const CRITERIA_OPTIONS = ["Days Before Arrival", "Committed Occupancy", "Demand Occupancy", "OTB"];
const OPERATORS = ["Less than", "Less than or equal to", "Greater than", "Greater than or equal to", "Equal to"];
const PROPERTY_OPTIONS = ["Property", "Room Type", "Segment"];
const UNIT_OPTIONS = ["%", "Rooms"];
const ON_DAY_OPTIONS = ["Current Day", "Yesterday", "2 Days Ago"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type CriteriaVal = { operator: string; value: string; property: string; unit: string; onDay: string };
const DEFAULT_CRITERIA_VAL: CriteriaVal = { operator: "Equal to", value: "0", property: "Property", unit: "%", onDay: "Current Day" };

type SeasonalRange = { startMonth: string; startDay: string; endMonth: string; endDay: string };
const DEFAULT_SEASONAL: SeasonalRange = { startMonth: "January", startDay: "1", endMonth: "December", endDay: "31" };

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

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildStayDateSummary(
  conditions: string[],
  stayDateRanges: Record<string, { start: string; end: string }>,
  seasonalRanges: Record<string, SeasonalRange>,
  stayDateDays: Record<string, Record<DayKey, boolean>>
): string {
  if (conditions.length === 0) return "Everyday";
  return conditions.map((c) => {
    if (c === "Active Day of Week") {
      const d = stayDateDays[c] ?? DEFAULT_DAYS;
      const active = DAY_KEYS.filter((k) => d[k]);
      return active.length === 7 ? "All days" : active.join(", ");
    }
    if (c === "Active Date Range") {
      const r = stayDateRanges[c];
      return r?.start && r?.end ? `${r.start} – ${r.end}` : "Date range";
    }
    if (c === "Seasonal Date Range") {
      const r = seasonalRanges[c] ?? DEFAULT_SEASONAL;
      return `${r.startMonth} ${r.startDay} – ${r.endMonth} ${r.endDay} (annually)`;
    }
    return c;
  }).join(" · ");
}

function buildRestrictionSummary(checked: Record<RestrictionKey, boolean>, values: Record<RestrictionKey, string>): string {
  const labels: Record<RestrictionType, string> = {
    CTS: "Closed to Stay", CTA: "Closed to Arrival", CTD: "Closed to Departure",
    MinSA: "Min Stay Arrival", MinST: "Min Stay Thru", MaxSA: "Max Stay Arrival", MaxST: "Max Stay Thru",
  };
  const parts: string[] = [];
  for (const r of RESTRICTIONS) {
    if (r.hasValue && values[r.key]) parts.push(`${labels[r.key]} ${values[r.key]}`);
    else if (!r.hasValue && checked[r.key]) parts.push(labels[r.key]);
  }
  return parts.join(", ") || "None";
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export default function NewRestrictionForm() {
  const searchParams = useSearchParams();
  const initialGroup = searchParams.get("group") ?? "";

  const [name, setName] = useState("");
  const [hotelGroup, setHotelGroup] = useState(initialGroup);
  const [strategyFor, setStrategyFor] = useState("Property");
  const [strategyForValue, setStrategyForValue] = useState("");
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
  const [seasonalRanges, setSeasonalRanges] = useState<Record<string, SeasonalRange>>({});

  // Criteria
  const [criteriaModalOpen, setCriteriaModalOpen] = useState(false);
  const [criteriaConditions, setCriteriaConditions] = useState<string[]>([]);
  const [pendingCriteria, setPendingCriteria] = useState<string[]>([]);
  const [criteriaValues, setCriteriaValues] = useState<Record<string, CriteriaVal>>({});

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);

  const anyRestrictionChecked = Object.values(checkedRestrictions).some(Boolean);
  const canSubmit =
    name.trim() &&
    hotelGroup &&
    (anyRestrictionChecked || Object.values(restrictionValues).some(Boolean));

  function toggleRestriction(key: RestrictionKey) {
    setCheckedRestrictions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Stay date toggle — enforces mutual exclusivity between date range types
  function toggleStayDatePending(val: string) {
    setPendingStayDates((prev) => {
      if (prev.includes(val)) return prev.filter((v) => v !== val);
      if (DATE_RANGE_EXCLUSIVE.includes(val)) {
        return [...prev.filter((v) => !DATE_RANGE_EXCLUSIVE.includes(v)), val];
      }
      return [...prev, val];
    });
  }

  function openStayDateModal() {
    setPendingStayDates([...stayDateConditions]);
    setStayDateModalOpen(true);
  }

  function confirmStayDates() {
    const newDays = { ...stayDateDays };
    const newRanges = { ...stayDateRanges };
    const newSeasonal = { ...seasonalRanges };
    for (const c of pendingStayDates) {
      if (c === "Active Day of Week" && !newDays[c]) newDays[c] = { ...DEFAULT_DAYS };
      else if (c === "Active Date Range" && !newRanges[c]) newRanges[c] = { start: "", end: "" };
      else if (c === "Seasonal Date Range" && !newSeasonal[c]) newSeasonal[c] = { ...DEFAULT_SEASONAL };
    }
    setStayDateDays(newDays);
    setStayDateRanges(newRanges);
    setSeasonalRanges(newSeasonal);
    setStayDateConditions([...pendingStayDates]);
    setStayDateModalOpen(false);
  }

  function removeStayDate(cond: string) {
    setStayDateConditions((prev) => prev.filter((c) => c !== cond));
    setStayDateDays((prev) => { const n = { ...prev }; delete n[cond]; return n; });
    setStayDateRanges((prev) => { const n = { ...prev }; delete n[cond]; return n; });
    setSeasonalRanges((prev) => { const n = { ...prev }; delete n[cond]; return n; });
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

  // Disabled options in the stay date modal
  const disabledStayDateOptions = pendingStayDates.includes("Active Date Range")
    ? ["Seasonal Date Range"]
    : pendingStayDates.includes("Seasonal Date Range")
    ? ["Active Date Range"]
    : [];

  const strategySecondaryOptions =
    strategyFor === "Yield Segments" ? YIELD_SEGMENTS
    : strategyFor === "Room Type" ? FORM_ROOM_TYPES
    : null;

  const impactedProperties = MOCK_PROPERTIES_BY_GROUP[hotelGroup] ?? [];

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      <AppHeader
        breadcrumb={[
          "Home",
          "Pricing & Strategy",
          { label: "Restriction Guidelines", href: "/restrictions" },
          "New",
        ]}
      />

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
        <div className="flex flex-col gap-5">

          {/* Top fields */}
          <div className="flex flex-col gap-5" style={{ maxWidth: "400px" }}>
            <FormField label="Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 px-[10px] rounded text-[13px] outline-none w-full"
                style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.white }}
              />
            </FormField>
            <FormField label="Enterprise Hotel Group" required>
              <SelectInput value={hotelGroup} options={HOTEL_GROUPS} onChange={setHotelGroup} placeholder="Select..." width="100%" />
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
                  <div key={cond} className="flex items-center gap-3" style={{ flexWrap: "nowrap" }}>
                    <ConditionChip label={cond} onRemove={() => removeStayDate(cond)} />
                    <span className="text-[13px] shrink-0" style={{ color: colors.textSecondary }}>is</span>
                    {cond === "Active Day of Week" && (
                      <DayOfWeekControl
                        days={stayDateDays[cond] ?? { ...DEFAULT_DAYS }}
                        onChange={(d) => setStayDateDays((prev) => ({ ...prev, [cond]: d }))}
                      />
                    )}
                    {cond === "Active Date Range" && (
                      <DateRangeControl
                        start={stayDateRanges[cond]?.start ?? ""}
                        end={stayDateRanges[cond]?.end ?? ""}
                        onStartChange={(v) => setStayDateRanges((prev) => ({ ...prev, [cond]: { ...prev[cond], start: v } }))}
                        onEndChange={(v) => setStayDateRanges((prev) => ({ ...prev, [cond]: { ...prev[cond], end: v } }))}
                      />
                    )}
                    {cond === "Seasonal Date Range" && (
                      <SeasonalDateRangeControl
                        val={seasonalRanges[cond] ?? { ...DEFAULT_SEASONAL }}
                        onChange={(v) => setSeasonalRanges((prev) => ({ ...prev, [cond]: v }))}
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
                  <div key={cond} className="flex items-center gap-3" style={{ flexWrap: "nowrap" }}>
                    <ConditionChip label={cond} onRemove={() => removeCriteria(cond)} />
                    <span className="text-[13px] shrink-0" style={{ color: colors.textSecondary }}>is</span>
                    <CriteriaControl
                      criteriaType={cond}
                      val={criteriaValues[cond] ?? { ...DEFAULT_CRITERIA_VAL }}
                      onChange={(patch) =>
                        setCriteriaValues((prev) => ({ ...prev, [cond]: { ...(prev[cond] ?? DEFAULT_CRITERIA_VAL), ...patch } }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t" style={{ borderColor: colors.border }} />

          {/* Set Strategy For */}
          <FormField label="Set Strategy For">
            <div className="flex items-center gap-3">
              <SelectInput
                value={strategyFor}
                options={STRATEGY_FOR_OPTIONS}
                onChange={(v) => { setStrategyFor(v); setStrategyForValue(""); }}
                width={200}
              />
              {strategySecondaryOptions && (
                <SelectInput
                  value={strategyForValue}
                  options={strategySecondaryOptions}
                  onChange={setStrategyForValue}
                  placeholder="Select..."
                  width={220}
                />
              )}
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
                  onValueChange={(v) => setRestrictionValues((prev) => ({ ...prev, [r.key]: v }))}
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
          onClick={() => canSubmit && setConfirmOpen(true)}
          className="px-5 h-9 rounded text-[14px]"
          style={
            canSubmit
              ? { backgroundColor: colors.primary, color: colors.white, fontWeight: 200, boxShadow: "0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)" }
              : { backgroundColor: "hsl(0 0% 93%)", color: "hsl(0 0% 62%)", cursor: "not-allowed", fontWeight: 200 }
          }
        >
          Create
        </button>
        <Link
          href="/restrictions"
          className="px-5 h-9 flex items-center rounded text-[14px]"
          style={{ backgroundColor: colors.white, border: `1px solid ${colors.primary}`, color: colors.primary, fontWeight: 200, boxShadow: "0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)" }}
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
        disabledOptions={disabledStayDateOptions}
        onToggle={toggleStayDatePending}
        onCancel={() => setStayDateModalOpen(false)}
        onAdd={confirmStayDates}
      />

      {/* Criteria modal */}
      <ConditionModal
        open={criteriaModalOpen}
        title="Add Criteria Conditions"
        options={CRITERIA_OPTIONS}
        pending={pendingCriteria}
        disabledOptions={[]}
        onToggle={(v) => setPendingCriteria((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])}
        onCancel={() => setCriteriaModalOpen(false)}
        onAdd={confirmCriteria}
      />

      {/* Confirmation modal */}
      {confirmOpen && (
        <ConfirmationModal
          name={name}
          hotelGroup={hotelGroup}
          stayDateSummary={buildStayDateSummary(stayDateConditions, stayDateRanges, seasonalRanges, stayDateDays)}
          criteriaSummary={criteriaConditions.length === 0 ? "Always" : criteriaConditions.join(", ")}
          strategyFor={strategyFor}
          strategyForValue={strategyForValue}
          restrictionSummary={buildRestrictionSummary(checkedRestrictions, restrictionValues)}
          properties={impactedProperties}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
        />
      )}
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

function RestrictionRow({ def, checked, value, onToggle, onValueChange }: {
  def: { key: RestrictionKey; label: string; hasValue: boolean };
  checked: boolean; value: string;
  onToggle: () => void; onValueChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-end gap-1.5 shrink-0" style={{ width: "160px" }}>
        <span className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>{def.label}</span>
        <span title={`${def.label} info`}><InfoIcon /></span>
      </div>
      {def.hasValue ? (
        <input
          type="number" min={0} max={99} value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => { if ([",", ".", "-", "e", "E"].includes(e.key)) e.preventDefault(); }}
          className="w-24 h-9 px-3 rounded text-[13px] outline-none"
          style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.white }}
        />
      ) : (
        <input type="checkbox" checked={checked} onChange={onToggle} className="w-4 h-4" style={{ accentColor: colors.primary }} />
      )}
    </div>
  );
}

function ConditionChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] shrink-0"
      style={{ width: "260px", backgroundColor: colors.primarySubtle, color: colors.primary, border: `1px solid ${colors.primary}` }}
    >
      <span className="flex-1 truncate">{label}</span>
      <button onClick={onRemove} className="flex items-center shrink-0" style={{ color: colors.primary }}>
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
          <input type="checkbox" checked={days[day]} onChange={() => onChange({ ...days, [day]: !days[day] })} className="w-4 h-4" style={{ accentColor: colors.primary }} />
        </label>
      ))}
    </div>
  );
}

function DateRangeControl({ start, end, onStartChange, onEndChange }: {
  start: string; end: string; onStartChange: (v: string) => void; onEndChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 h-9 rounded text-[13px]" style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.white }}>
      <input type="date" value={start} onChange={(e) => onStartChange(e.target.value)} className="outline-none bg-transparent text-[13px]" style={{ color: colors.textPrimary }} />
      <span style={{ color: colors.textSecondary }}>–</span>
      <input type="date" value={end} onChange={(e) => onEndChange(e.target.value)} className="outline-none bg-transparent text-[13px]" style={{ color: colors.textPrimary }} />
    </div>
  );
}

function SeasonalDateRangeControl({ val, onChange }: { val: SeasonalRange; onChange: (v: SeasonalRange) => void }) {
  return (
    <div className="inline-flex items-center gap-2">
      <SelectInput value={val.startMonth} options={MONTHS} onChange={(v) => onChange({ ...val, startMonth: v })} width={130} />
      <input
        type="number" min={1} max={31} value={val.startDay}
        onChange={(e) => onChange({ ...val, startDay: e.target.value })}
        className="w-14 h-9 px-2 rounded text-[13px] text-center outline-none"
        style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.white }}
      />
      <span className="text-[13px] shrink-0" style={{ color: colors.textSecondary }}>–</span>
      <SelectInput value={val.endMonth} options={MONTHS} onChange={(v) => onChange({ ...val, endMonth: v })} width={130} />
      <input
        type="number" min={1} max={31} value={val.endDay}
        onChange={(e) => onChange({ ...val, endDay: e.target.value })}
        className="w-14 h-9 px-2 rounded text-[13px] text-center outline-none"
        style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.white }}
      />
      <span className="text-[12px] italic shrink-0" style={{ color: colors.textDisabled }}>repeats annually</span>
    </div>
  );
}

function CriteriaControl({ criteriaType, val, onChange }: { criteriaType: string; val: CriteriaVal; onChange: (p: Partial<CriteriaVal>) => void }) {
  if (criteriaType === "Days Before Arrival") {
    return (
      <div className="flex items-center gap-2">
        <SelectInput value={val.operator} options={OPERATORS} onChange={(v) => onChange({ operator: v })} width={220} />
        <input type="number" value={val.value} onChange={(e) => onChange({ value: e.target.value })} className="w-20 h-9 px-3 rounded text-[13px] outline-none" style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.white }} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2" style={{ flexWrap: "nowrap" }}>
      <span className="text-[13px] shrink-0" style={{ color: colors.textSecondary }}>for</span>
      <SelectInput value={val.property} options={PROPERTY_OPTIONS} onChange={(v) => onChange({ property: v })} width={130} />
      <SelectInput value={val.operator} options={OPERATORS} onChange={(v) => onChange({ operator: v })} width={220} />
      <input type="number" value={val.value} onChange={(e) => onChange({ value: e.target.value })} className="w-20 h-9 px-3 rounded text-[13px] outline-none" style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.white }} />
      <SelectInput value={val.unit} options={UNIT_OPTIONS} onChange={(v) => onChange({ unit: v })} width={80} />
      <span className="text-[13px] shrink-0" style={{ color: colors.textSecondary }}>on</span>
      <SelectInput value={val.onDay} options={ON_DAY_OPTIONS} onChange={(v) => onChange({ onDay: v })} width={150} />
      <span title="Info"><InfoIcon /></span>
    </div>
  );
}

function ConditionModal({ open, title, options, pending, disabledOptions, onToggle, onCancel, onAdd }: {
  open: boolean; title: string; options: string[]; pending: string[];
  disabledOptions: string[]; onToggle: (v: string) => void; onCancel: () => void; onAdd: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl w-full mx-6 flex flex-col" style={{ maxWidth: "480px", maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>{title}</h2>
          <button onClick={onCancel} style={{ color: colors.textSecondary }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-3">
          {options.map((opt) => {
            const selected = pending.includes(opt);
            const disabled = disabledOptions.includes(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-3 px-4 py-3 rounded"
                style={{
                  border: `1px solid ${selected ? colors.primary : colors.border}`,
                  opacity: disabled ? 0.4 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                <input
                  type="checkbox" checked={selected}
                  onChange={() => !disabled && onToggle(opt)}
                  disabled={disabled}
                  className="w-4 h-4"
                  style={{ accentColor: colors.primary }}
                />
                <div className="flex flex-col">
                  <span className="text-[14px]" style={{ color: selected ? colors.textPrimary : colors.textSecondary }}>{opt}</span>
                  {opt === "Seasonal Date Range" && disabled && (
                    <span className="text-[11px]" style={{ color: colors.textDisabled }}>Cannot be used with Active Date Range</span>
                  )}
                  {opt === "Active Date Range" && disabled && (
                    <span className="text-[11px]" style={{ color: colors.textDisabled }}>Cannot be used with Seasonal Date Range</span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-4 px-6 py-4 border-t" style={{ borderColor: colors.border }}>
          <button onClick={onCancel} className="text-[13px] font-semibold" style={{ color: colors.primary }}>Cancel</button>
          <button onClick={onAdd} className="px-5 h-9 rounded text-[13px] font-semibold" style={{ backgroundColor: colors.primary, color: colors.white }}>Add</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({ name, hotelGroup, stayDateSummary, criteriaSummary, strategyFor, strategyForValue, restrictionSummary, properties, onCancel, onConfirm }: {
  name: string; hotelGroup: string; stayDateSummary: string; criteriaSummary: string;
  strategyFor: string; strategyForValue: string; restrictionSummary: string;
  properties: { name: string; existingStrategies: number }[];
  onCancel: () => void; onConfirm: () => void;
}) {
  const chipIsProperty = strategyFor === "Property";
  const strategyLabel = strategyForValue ? `${strategyFor} — ${strategyForValue}` : strategyFor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onCancel}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full mx-6 flex flex-col"
        style={{ maxWidth: "560px", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>Review &amp; Create</h2>
          <button onClick={onCancel} style={{ color: colors.textSecondary }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-5 flex flex-col gap-5">

          {/* Guideline summary — styled like a GuidelineCard */}
          <div>
            <p className="text-[12px] font-bold mb-2" style={{ color: colors.textSecondary }}>Guideline</p>
            <div className="rounded" style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)" }}>
              {/* Card top */}
              <div className="flex items-center gap-2 px-4 pt-4 pb-2 flex-wrap">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold shrink-0"
                  style={chipIsProperty
                    ? { backgroundColor: colors.chipProperty, color: colors.primary }
                    : { backgroundColor: colors.chipSegment, color: colors.textPrimary }}
                >
                  {strategyFor}
                </span>
                {strategyForValue && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold shrink-0"
                    style={{ backgroundColor: colors.chipSegment, color: colors.textPrimary }}
                  >
                    {strategyForValue}
                  </span>
                )}
                <span className="text-[15px] font-bold" style={{ color: colors.textPrimary }}>{name}</span>
              </div>
              <div className="px-4 pb-3">
                <p className="text-[13px]" style={{ color: colors.textSecondary }}>{hotelGroup} — {restrictionSummary}</p>
              </div>
              <div className="border-t mx-4" style={{ borderColor: colors.border }} />
              <div className="px-4 py-3 flex flex-col gap-1.5">
                <ConfirmDetailRow label="Stay Date" value={stayDateSummary} />
                <ConfirmDetailRow label="Criteria" value={criteriaSummary} />
                <ConfirmDetailRow label="Strategy For" value={strategyLabel} />
              </div>
            </div>
          </div>

          {/* Impacted properties — bordered scrollable list */}
          <div>
            <p className="text-[12px] font-bold mb-2" style={{ color: colors.textSecondary }}>
              Impacted Properties
              <span className="ml-1.5 normal-case font-normal" style={{ color: colors.textDisabled }}>({properties.length} in {hotelGroup})</span>
            </p>
            <div className="rounded overflow-hidden" style={{ border: `1px solid ${colors.primary}` }}>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {properties.length === 0 ? (
                  <p className="px-4 py-3 text-[13px]" style={{ color: colors.textDisabled }}>No properties found for this hotel group.</p>
                ) : (
                  properties.map((p, i) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between px-4 py-2.5"
                      style={{ borderBottom: i < properties.length - 1 ? `1px solid ${colors.border}` : undefined }}
                    >
                      <span className="text-[13px]" style={{ color: colors.textPrimary }}>{p.name}</span>
                      <button
                        className="inline-flex items-center gap-1.5 text-[12px] hover:underline shrink-0"
                        style={{ color: p.existingStrategies > 0 ? colors.primary : colors.textDisabled }}
                      >
                        <ExternalLinkIcon />
                        {p.existingStrategies > 0
                          ? `${p.existingStrategies} ${p.existingStrategies === 1 ? "strategy" : "strategies"} already`
                          : "No strategies"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 px-6 py-4 border-t" style={{ borderColor: colors.border }}>
          <button onClick={onCancel} className="text-[13px] font-semibold" style={{ color: colors.primary }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 h-9 rounded text-[13px] font-semibold"
            style={{ backgroundColor: colors.primary, color: colors.white, boxShadow: "0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)" }}
          >
            Create Guideline
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[12px] shrink-0 text-right" style={{ color: colors.textDisabled, width: "76px" }}>{label}:</span>
      <span className="text-[13px]" style={{ color: colors.textPrimary }}>{value}</span>
    </div>
  );
}
