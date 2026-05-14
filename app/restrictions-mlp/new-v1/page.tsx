"use client";

import { useState, useRef, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { colors } from "@/lib/tokens";
import { RESTRICTIONS, HOTEL_GROUPS, YIELD_SEGMENTS, FORM_ROOM_TYPES } from "@/lib/data";
import { useRestrictions } from "@/lib/restrictions-context";
import type { RestrictionType, GuidelineRule } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ["New Guideline", "Stay Date", "Trigger Criteria", "Set Restrictions"];
const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
type DayKey = (typeof DAY_KEYS)[number];
const ALL_DAYS_ON: Record<DayKey, boolean> = { Sun: true, Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true };

const CRITERIA = ["Days Before Arrival", "Committed Occupancy", "Demand Occupancy", "Demand Occupancy Change", "OTB", "Pickup"] as const;
type CriteriaKey = (typeof CRITERIA)[number];

const CRITERIA_LABELS: Record<CriteriaKey, { title: string; abbr?: string; subtitle: string; isNew?: boolean }> = {
  "Days Before Arrival":      { title: "Days Before Arrival", abbr: "DBA", subtitle: "Only apply the restriction within a window of time before the specified stay dates" },
  "Committed Occupancy":      { title: "Committed Occupancy", subtitle: "Trigger the restriction when enough rooms are spoken for, including group blocks even if not yet individually booked" },
  "Demand Occupancy":         { title: "Demand Occupancy", subtitle: "Trigger when Duetto's forecast says a date will be busy, even if bookings aren't there yet" },
  "Demand Occupancy Change":  { title: "Demand Occupancy Change", subtitle: "Trigger when Duetto's demand forecast has changed significantly since the day before — specify in percentage points (e.g. 10 pp = a move from 40% to 50% occupancy)", isNew: true },
  "OTB":                      { title: "On the Books", abbr: "OTB", subtitle: "Trigger the restriction only when enough real individual bookings have come in (group blocks excluded)" },
  "Pickup":                   { title: "Pickup", subtitle: "Trigger when bookings are coming in fast over a recent window", isNew: true },
};

// Which criteria get a scope dropdown and whether that includes room types
const CRITERIA_HAS_SCOPE = new Set<CriteriaKey>(["Committed Occupancy", "Demand Occupancy", "OTB"]);
const SCOPE_INCLUDES_ROOMTYPE = new Set<CriteriaKey>(["Committed Occupancy", "OTB"]);

const OPERATORS = ["Less than", "Less than or equal to", "Equal to", "Greater than or equal to", "Greater than"];
const ON_DAYS = ["Current Day", "Yesterday", "2 Days Ago"];
const REL_DEMAND_REFS = ["Yesterday", "2 Days Ago", "Last Week"];
const PICKUP_WINDOWS = ["1 day", "3 days", "7 days"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DROPDOWN_MAX_WIDTH = 320;

type MockEvent = { name: string; start: string; end: string };
const MOCK_EVENTS: MockEvent[] = [
  { name: "New Year's Eve Gala",         start: "2026-12-31", end: "2027-01-02" },
  { name: "Valentine's Weekend",         start: "2027-02-13", end: "2027-02-16" },
  { name: "Fashion Week SS27",           start: "2027-02-09", end: "2027-02-17" },
  { name: "Corporate Retreat Series",    start: "2027-03-08", end: "2027-03-12" },
  { name: "Easter Long Weekend",         start: "2027-04-01", end: "2027-04-06" },
  { name: "Spring Music Festival",       start: "2027-04-18", end: "2027-04-20" },
  { name: "Local Marathon",              start: "2027-04-26", end: "2027-04-27" },
  { name: "Grand Prix Weekend",          start: "2027-05-22", end: "2027-05-25" },
  { name: "International Conference",    start: "2027-06-14", end: "2027-06-18" },
  { name: "Summer Jazz Festival",        start: "2027-07-10", end: "2027-07-13" },
  { name: "Fashion Week AW27",           start: "2027-09-08", end: "2027-09-16" },
  { name: "Oktoberfest",                 start: "2027-09-18", end: "2027-10-03" },
  { name: "Christmas Market",            start: "2027-11-27", end: "2027-12-24" },
];

const RESTRICTION_SUBTEXTS: Record<RestrictionType, string> = {
  CTS:   "No new reservations that include this date, regardless of arrival or departure",
  CTA:   "Guests cannot check in on this date",
  CTD:   "Guests cannot check out on this date",
  MinST: "Any reservation passing through this date must be at least this many nights",
  MaxST: "Any reservation passing through this date cannot exceed this many nights",
  MinSA: "Guests arriving on this date must book at least this many nights",
  MaxSA: "Guests arriving on this date cannot book more than this many nights",
};

const RESTRICTION_CONFLICTS: Partial<Record<RestrictionType, RestrictionType[]>> = {
  CTS:   ["CTA", "CTD", "MinST", "MaxST", "MinSA", "MaxSA"],
  CTA:   ["CTS", "MinST", "MaxSA"],
  MinSA: ["CTS", "CTA"],
  MinST: ["CTS"],
  MaxSA: ["CTA", "CTS"],
  MaxST: ["CTS"],
};

function getDisabledRestrictions(checked: Record<string, boolean>): Set<RestrictionType> {
  const disabled = new Set<RestrictionType>();
  for (const [key, conflicts] of Object.entries(RESTRICTION_CONFLICTS)) {
    if (checked[key]) conflicts.forEach(c => disabled.add(c));
  }
  return disabled;
}

type StrategyFor = "Property" | "Yield Segments" | "Room Type";
type TimePeriod = "all" | "daterange" | "seasonal" | "event";
type CriteriaConfig = { operator: string; value: string; unit: "%" | "Rooms"; onDay: string; scope: string };

const DEFAULT_CRIT: CriteriaConfig    = { operator: "Less than",     value: "", unit: "%",     onDay: "Current Day",    scope: "Property" };
const DEFAULT_DMDCHG: CriteriaConfig  = { operator: "Higher",        value: "", unit: "%",     onDay: "Yesterday",      scope: "Property" };
const DEFAULT_PICKUP: CriteriaConfig  = { operator: "Greater than",  value: "", unit: "Rooms", onDay: "Last 24 hours",  scope: "Property" };

function defaultFor(c: string): CriteriaConfig {
  if (c === "Demand Occupancy Change") return { ...DEFAULT_DMDCHG };
  if (c === "Pickup")                  return { ...DEFAULT_PICKUP };
  return { ...DEFAULT_CRIT };
}

// ─── Coachmark context ────────────────────────────────────────────────────────

const CoachmarkContext = createContext(false);

// ─── Coachmark ────────────────────────────────────────────────────────────────

function Coachmark({ text, href }: { text: string; href?: string }) {
  const [show, setShow] = useState(false);
  const iconsVisible = useContext(CoachmarkContext);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Icons only render when the toggle is on; tooltip appears on hover as normal
  if (!iconsVisible) return null;

  function enter() { clearTimeout(timer.current); setShow(true); }
  function leave() { timer.current = setTimeout(() => setShow(false), 150); }

  return (
    <span className="relative inline-flex items-center shrink-0" onMouseEnter={enter} onMouseLeave={leave}>
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center cursor-default shrink-0"
        style={{ backgroundColor: "#C4FF45" }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill={colors.navBg}>
          <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/>
        </svg>
      </span>
      {show && (
        <span
          className="absolute left-6 top-0 z-50 rounded shadow-xl py-2.5 px-3"
          style={{ backgroundColor: colors.navBg, width: 240, pointerEvents: "auto" }}
          onMouseEnter={enter} onMouseLeave={leave}>
          <p className="text-[12px] leading-relaxed mb-1.5" style={{ color: colors.white }}>{text}</p>
          {href && (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="text-[11px] underline font-semibold"
              style={{ color: "#C4FF45" }}>
              View ticket ↗
            </a>
          )}
        </span>
      )}
    </span>
  );
}

// ─── NewBadge ─────────────────────────────────────────────────────────────────

function NewBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: "#C8F0EB", color: colors.primary }}>
      New
    </span>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[13px] font-semibold mb-1.5" style={{ color: colors.textPrimary }}>{label}</p>
      {children}
    </div>
  );
}

function InlineSelect({ value, onChange, options, width }: {
  value: string; onChange: (v: string) => void; options: string[]; width?: number;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-7 px-2 rounded border text-[12px] outline-none"
      style={{ borderColor: colors.borderSubtle, color: colors.textPrimary, backgroundColor: colors.white, width }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// Scope dropdown with optgroup headers for Segment and (optionally) Room Type
function ScopeSelect({ value, onChange, includeRoomTypes }: {
  value: string; onChange: (v: string) => void; includeRoomTypes: boolean;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-7 px-2 rounded border text-[12px] outline-none"
      style={{ borderColor: colors.borderSubtle, color: colors.textPrimary, backgroundColor: colors.white }}>
      <option value="Property">Property</option>
      <optgroup label="Segment">
        {YIELD_SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
      </optgroup>
      {includeRoomTypes && (
        <optgroup label="Room Type">
          {FORM_ROOM_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
        </optgroup>
      )}
    </select>
  );
}

function formatEventDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

// ─── MultiSelect ─────────────────────────────────────────────────────────────

function MultiSelect({ options, selected, onChange, placeholder, allLabel }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
  placeholder: string; allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const allSelected = selected.length === options.length;
  const label = selected.length === 0 ? placeholder
    : allSelected ? (allLabel ?? "All")
    : selected.length === 1 ? selected[0]
    : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative mt-2">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between h-8 px-3 rounded border w-full text-[13px] text-left"
        style={{ borderColor: colors.borderSubtle, backgroundColor: colors.white, color: selected.length ? colors.textPrimary : colors.textDisabled }}>
        <span className="truncate">{label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1 shrink-0"><path d="M7 10l5 5 5-5H7z"/></svg>
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-50 rounded shadow-lg w-full max-h-52 overflow-y-auto"
          style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}` }}>
          <div className="px-3 py-2 border-b" style={{ borderColor: colors.border }}>
            <button type="button" onClick={() => onChange(allSelected ? [] : [...options])}
              className="text-[12px] hover:underline" style={{ color: colors.primary }}>
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-[13px]"
              style={{ color: colors.textPrimary }}>
              <input type="checkbox" checked={selected.includes(opt)}
                onChange={() => onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])}
                className={`w-4 h-4 shrink-0 accent-[${colors.primary}]`} />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EventSearchSelect ───────────────────────────────────────────────────────

function EventSearchSelect({ options, onChange, placeholder }: {
  options: MockEvent[]; onChange: (v: MockEvent) => void; placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} className="relative mt-2" style={{ maxWidth: DROPDOWN_MAX_WIDTH }}>
      <div className="relative">
        <input type="text" value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-8 pl-3 pr-8 rounded border w-full text-[13px] outline-none"
          style={{ borderColor: colors.borderSubtle, color: query ? colors.textPrimary : colors.textDisabled, backgroundColor: colors.white }} />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: colors.textSecondary }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5H7z"/></svg>
        </span>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-9 z-50 rounded shadow-lg py-1 w-full max-h-52 overflow-y-auto"
          style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}` }}>
          {filtered.map(opt => (
            <button key={opt.name} type="button"
              className="block w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={() => { onChange(opt); setQuery(""); setOpen(false); }}>
              <p className="text-[13px]" style={{ color: colors.textPrimary }}>{opt.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                {formatEventDate(opt.start)} – {formatEventDate(opt.end)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TemplateSelect ───────────────────────────────────────────────────────────

function TemplateSelect({ rules, onSelect }: { rules: GuidelineRule[]; onSelect: (r: GuidelineRule) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = rules.filter(r => r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} className="relative mt-2">
      <input type="text" value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search guidelines..."
        className="h-8 px-3 rounded border w-full text-[13px] outline-none"
        style={{ borderColor: colors.borderSubtle, color: colors.textPrimary }} />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-9 z-50 rounded shadow-lg py-1 w-full max-h-52 overflow-y-auto"
          style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}` }}>
          {filtered.map(r => (
            <button key={r.id} type="button"
              className="block w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={() => { onSelect(r); setQuery(r.name); setOpen(false); }}>
              <p className="text-[13px]" style={{ color: colors.textPrimary }}>{r.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                {r.hotelGroup} | {r.stayDate}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── StepIndicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex mb-6" style={{ height: 40 }}>
      {STEPS.map((label, i) => {
        const state = i < step ? "done" : i === step ? "active" : "upcoming";
        const bg = state === "active" ? colors.primary : state === "done" ? "#3a8280" : colors.chipSegment;
        const fg = state === "upcoming" ? colors.textSecondary : colors.white;
        const isFirst = i === 0;
        const isLast = i === STEPS.length - 1;
        const clip = isFirst
          ? "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)"
          : isLast
          ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)"
          : "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)";
        return (
          <div key={label}
            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold select-none"
            style={{ backgroundColor: bg, color: fg, clipPath: clip, marginLeft: isFirst ? 0 : -1, zIndex: i + 1, position: "relative" }}>
            {state === "done" && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            )}
            {label}
          </div>
        );
      })}
    </div>
  );
}

// ─── Phase 1: New Guideline ───────────────────────────────────────────────────

function Phase1({ name, setName, hotelGroup, setHotelGroup, strategyFor, setStrategyFor, selectedSegments, setSelectedSegments, selectedRoomTypes, setSelectedRoomTypes, rules, useTemplate, setUseTemplate, onTemplateSelect }: {
  name: string; setName: (v: string) => void;
  hotelGroup: string; setHotelGroup: (v: string) => void;
  strategyFor: StrategyFor; setStrategyFor: (v: StrategyFor) => void;
  selectedSegments: string[]; setSelectedSegments: (v: string[]) => void;
  selectedRoomTypes: string[]; setSelectedRoomTypes: (v: string[]) => void;
  rules: GuidelineRule[];
  useTemplate: boolean; setUseTemplate: (v: boolean) => void;
  onTemplateSelect: (rule: GuidelineRule) => void;
}) {
  return (
    <div>
      <Field label="Guideline name">
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Summer Weekend Min Stay"
          className="h-8 px-3 rounded border text-[13px] outline-none"
          style={{ borderColor: colors.borderSubtle, color: colors.textPrimary, maxWidth: DROPDOWN_MAX_WIDTH, width: "100%" }} />
      </Field>

      <div className="mb-5 -mt-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={useTemplate} onChange={() => setUseTemplate(!useTemplate)}
              className={`w-4 h-4 shrink-0 accent-[${colors.primary}]`} />
            <span className="text-[12px]" style={{ color: colors.textSecondary }}>
              Use an existing guideline as a template for criteria and restriction rules
            </span>
          </label>
          <Coachmark
            text="Quickly reuse the criteria and restriction settings from any saved guideline as a starting point."
            href="https://duettoresearch.atlassian.net/jira/software/projects/ENH/issues/ENH-288"
          />
        </div>
        {useTemplate && (
          <div style={{ marginLeft: 24, maxWidth: DROPDOWN_MAX_WIDTH }}>
            <TemplateSelect rules={rules} onSelect={onTemplateSelect} />
          </div>
        )}
      </div>

      <Field label="Hotel group">
        <div className="relative" style={{ maxWidth: DROPDOWN_MAX_WIDTH }}>
          <select value={hotelGroup} onChange={e => setHotelGroup(e.target.value)}
            className="h-8 pl-3 pr-8 rounded border w-full text-[13px] outline-none appearance-none"
            style={{ borderColor: colors.borderSubtle, color: colors.textPrimary, backgroundColor: colors.white }}>
            {HOTEL_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: colors.textSecondary }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5H7z"/></svg>
          </span>
        </div>
      </Field>

      <Field label="Strategy for">
        <div className="flex flex-col gap-3">
          {(["Property", "Yield Segments", "Room Type"] as StrategyFor[]).map(opt => (
            <div key={opt}>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="strategyFor" checked={strategyFor === opt}
                    onChange={() => setStrategyFor(opt)}
                    className={`w-4 h-4 shrink-0 accent-[${colors.primary}]`} />
                  <span className="text-[13px]" style={{ color: colors.textPrimary }}>{opt}</span>
                </label>
                {(opt === "Yield Segments" || opt === "Room Type") && (
                  <Coachmark
                    text={opt === "Yield Segments"
                      ? "Apply a single guideline across multiple yield segments at once."
                      : "Apply a single guideline across multiple room types at once."}
                    href="https://duettoresearch.atlassian.net/jira/polaris/projects/APM/ideas/view/1462758?selectedIssue=APM-1090"
                  />
                )}
              </div>
              {opt === "Yield Segments" && strategyFor === "Yield Segments" && (
                <div style={{ marginLeft: 26, maxWidth: DROPDOWN_MAX_WIDTH }}>
                  <MultiSelect options={YIELD_SEGMENTS} selected={selectedSegments} onChange={setSelectedSegments}
                    placeholder="Select segments..." allLabel="All segments" />
                </div>
              )}
              {opt === "Room Type" && strategyFor === "Room Type" && (
                <div style={{ marginLeft: 26, maxWidth: DROPDOWN_MAX_WIDTH }}>
                  <MultiSelect options={FORM_ROOM_TYPES} selected={selectedRoomTypes} onChange={setSelectedRoomTypes}
                    placeholder="Select room types..." allLabel="All room types" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Field>
    </div>
  );
}

// ─── Phase 2: Stay Date ───────────────────────────────────────────────────────

function Phase2({ days, setDays, timePeriod, setTimePeriod, dateStart, setDateStart, dateEnd, setDateEnd,
  seasonalStartMonth, setSeasonalStartMonth, seasonalStartDay, setSeasonalStartDay,
  seasonalEndMonth, setSeasonalEndMonth, seasonalEndDay, setSeasonalEndDay,
  selectedEvent, setSelectedEvent }: {
  days: Record<DayKey, boolean>; setDays: (v: Record<DayKey, boolean>) => void;
  timePeriod: TimePeriod; setTimePeriod: (v: TimePeriod) => void;
  dateStart: string; setDateStart: (v: string) => void;
  dateEnd: string; setDateEnd: (v: string) => void;
  seasonalStartMonth: string; setSeasonalStartMonth: (v: string) => void;
  seasonalStartDay: string; setSeasonalStartDay: (v: string) => void;
  seasonalEndMonth: string; setSeasonalEndMonth: (v: string) => void;
  seasonalEndDay: string; setSeasonalEndDay: (v: string) => void;
  selectedEvent: string; setSelectedEvent: (v: string) => void;
}) {
  const eventData = MOCK_EVENTS.find(e => e.name === selectedEvent);

  return (
    <div>
      <Field label="Day of week">
        <div className="flex gap-2 flex-wrap">
          {DAY_KEYS.map(day => (
            <button key={day} type="button"
              onClick={() => setDays({ ...days, [day]: !days[day] })}
              className="rounded-full text-[12px] font-semibold border transition-colors"
              style={{
                width: 42, height: 42,
                backgroundColor: days[day] ? colors.primary : colors.white,
                color: days[day] ? colors.white : colors.textSecondary,
                borderColor: days[day] ? colors.primary : colors.border,
              }}>
              {day}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Time period">
        <div className="flex flex-col gap-3">
          {([
            { val: "all" as TimePeriod, label: "All time" },
            { val: "daterange" as TimePeriod, label: "Date range" },
            { val: "seasonal" as TimePeriod, label: "Seasonal (annually)" },
            { val: "event" as TimePeriod, label: "Tied to event" },
          ]).map(({ val, label }) => (
            <div key={val}>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="timePeriod" checked={timePeriod === val}
                    onChange={() => { setTimePeriod(val); if (val !== "event") setSelectedEvent(""); }}
                    className={`w-4 h-4 shrink-0 accent-[${colors.primary}]`} />
                  <span className="text-[13px]" style={{ color: colors.textPrimary }}>{label}</span>
                </label>
                {val === "event" && (
                  <Coachmark text="Requested by B&B Hotels — tie a guideline's stay date window directly to a configured event." />
                )}
              </div>

              {val === "daterange" && timePeriod === "daterange" && (
                <div className="mt-2 flex items-center gap-2 flex-wrap" style={{ marginLeft: 26 }}>
                  <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)}
                    className="h-8 px-2 rounded border text-[13px] outline-none"
                    style={{ borderColor: colors.borderSubtle, color: colors.textPrimary }} />
                  <span className="text-[13px]" style={{ color: colors.textSecondary }}>to</span>
                  <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)}
                    className="h-8 px-2 rounded border text-[13px] outline-none"
                    style={{ borderColor: colors.borderSubtle, color: colors.textPrimary }} />
                </div>
              )}
              {val === "seasonal" && timePeriod === "seasonal" && (
                <div className="mt-2 flex items-center gap-2 flex-wrap" style={{ marginLeft: 26 }}>
                  <InlineSelect value={seasonalStartMonth} onChange={setSeasonalStartMonth} options={MONTHS} width={128} />
                  <input type="number" min="1" max="31" value={seasonalStartDay} onChange={e => setSeasonalStartDay(e.target.value)}
                    className="h-7 px-2 rounded border text-[12px] outline-none text-center"
                    style={{ borderColor: colors.borderSubtle, color: colors.textPrimary, width: 52 }} />
                  <span className="text-[12px]" style={{ color: colors.textSecondary }}>to</span>
                  <InlineSelect value={seasonalEndMonth} onChange={setSeasonalEndMonth} options={MONTHS} width={128} />
                  <input type="number" min="1" max="31" value={seasonalEndDay} onChange={e => setSeasonalEndDay(e.target.value)}
                    className="h-7 px-2 rounded border text-[12px] outline-none text-center"
                    style={{ borderColor: colors.borderSubtle, color: colors.textPrimary, width: 52 }} />
                </div>
              )}
              {val === "event" && timePeriod === "event" && (
                <div style={{ marginLeft: 26 }} className="mt-2">
                  {selectedEvent && eventData ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[13px] font-medium" style={{ color: colors.textPrimary }}>{selectedEvent}</span>
                        <button type="button" onClick={() => setSelectedEvent("")}
                          className="text-[12px] hover:underline" style={{ color: colors.primary }}>
                          Change
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="date" value={eventData.start} disabled
                          className="h-8 px-2 rounded border text-[13px]"
                          style={{ borderColor: colors.border, color: colors.textSecondary, backgroundColor: colors.pageBg }} />
                        <span className="text-[13px]" style={{ color: colors.textSecondary }}>to</span>
                        <input type="date" value={eventData.end} disabled
                          className="h-8 px-2 rounded border text-[13px]"
                          style={{ borderColor: colors.border, color: colors.textSecondary, backgroundColor: colors.pageBg }} />
                      </div>
                    </div>
                  ) : (
                    <EventSearchSelect options={MOCK_EVENTS} onChange={ev => setSelectedEvent(ev.name)} placeholder="Search events..." />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Field>
    </div>
  );
}

// ─── Phase 3: Trigger Criteria ────────────────────────────────────────────────

function Phase3({ enabled, setEnabled, configs, setConfigs }: {
  enabled: Record<string, boolean>;
  setEnabled: (v: Record<string, boolean>) => void;
  configs: Record<string, CriteriaConfig[]>;
  setConfigs: (v: Record<string, CriteriaConfig[]>) => void;
}) {
  function toggle(c: string) {
    setEnabled({ ...enabled, [c]: !enabled[c] });
    if (!configs[c] || configs[c].length === 0) {
      setConfigs({ ...configs, [c]: [defaultFor(c)] });
    }
  }

  function patch(c: string, idx: number, p: Partial<CriteriaConfig>) {
    const arr = configs[c] ?? [defaultFor(c)];
    setConfigs({ ...configs, [c]: arr.map((row, i) => i === idx ? { ...row, ...p } : row) });
  }

  function addCondition(c: string) {
    const arr = configs[c] ?? [];
    setConfigs({ ...configs, [c]: [...arr, defaultFor(c)] });
  }

  function removeCondition(c: string, idx: number) {
    const arr = configs[c] ?? [];
    setConfigs({ ...configs, [c]: arr.filter((_, i) => i !== idx) });
  }

  return (
    <div>
      <p className="text-[13px] mb-4" style={{ color: colors.textSecondary }}>
        All criteria are optional — leave unchecked to apply this guideline without any conditions.
      </p>
      <div className="flex flex-col gap-3">
        {CRITERIA.map(c => {
          const on = enabled[c] ?? false;
          const meta = CRITERIA_LABELS[c];
          const isDmdChange = c === "Demand Occupancy Change";
          const isPickup = c === "Pickup";
          const hasScope = CRITERIA_HAS_SCOPE.has(c);
          const includeRoomTypes = SCOPE_INCLUDES_ROOMTYPE.has(c);
          const conditions = configs[c] ?? [];

          return (
            <div key={c} className="rounded border p-4"
              style={{ borderColor: on ? colors.primary : colors.border, backgroundColor: colors.white }}>

              {/* Card header — coachmark sits inline with title text, not pushed to far right */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={on} onChange={() => toggle(c)}
                  className={`w-4 h-4 shrink-0 mt-0.5 accent-[${colors.primary}]`} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold leading-tight" style={{ color: colors.textPrimary }}>
                      {meta.title}
                      {meta.abbr && (
                        <span className="ml-1 font-normal text-[12px]" style={{ color: colors.textSecondary }}>({meta.abbr})</span>
                      )}
                    </span>
                    {meta.isNew && <NewBadge />}
                    {(isDmdChange || isPickup) && (
                      <Coachmark
                        text="Trigger criteria based on how today's demand compares to a previous day's forecast."
                        href="https://duettoresearch.atlassian.net/jira/polaris/projects/APM/ideas/view/1462758?selectedIssue=APM-1412&issueViewSection=overview"
                      />
                    )}
                  </div>
                  <p className="text-[12px] mt-0.5 leading-snug" style={{ color: colors.textSecondary }}>{meta.subtitle}</p>
                </div>
              </label>

              {on && (
                <div className="mt-3" style={{ marginLeft: 28 }}>
                  {conditions.map((cfg, idx) => (
                    <div key={idx}
                      className={`flex items-center gap-2 flex-wrap${idx > 0 ? " mt-2 pt-2 border-t" : ""}`}
                      style={idx > 0 ? { borderColor: colors.border } : {}}>

                      {hasScope && (
                        <ScopeSelect
                          value={cfg.scope}
                          onChange={v => patch(c, idx, { scope: v })}
                          includeRoomTypes={includeRoomTypes}
                        />
                      )}

                      {isDmdChange ? (
                        // "Forecast changed by [N] pp [Higher/Lower] than [reference]"
                        <>
                          <span className="text-[12px]" style={{ color: colors.textSecondary }}>Forecast changed by</span>
                          <input type="number" value={cfg.value} onChange={e => patch(c, idx, { value: e.target.value })}
                            placeholder="0"
                            className="h-7 px-2 rounded border text-[12px] outline-none text-center"
                            style={{ borderColor: colors.borderSubtle, color: colors.textPrimary, width: 56 }} />
                          <span className="text-[12px]" style={{ color: colors.textSecondary }}>pp</span>
                          <InlineSelect value={cfg.operator} onChange={v => patch(c, idx, { operator: v })} options={["Higher", "Lower"]} />
                          <span className="text-[12px]" style={{ color: colors.textSecondary }}>than</span>
                          <InlineSelect value={cfg.onDay} onChange={v => patch(c, idx, { onDay: v })} options={REL_DEMAND_REFS} />
                        </>
                      ) : isPickup ? (
                        // "[operator] [value] [%/Rooms] booked in [window]"
                        <>
                          <InlineSelect value={cfg.operator} onChange={v => patch(c, idx, { operator: v })} options={OPERATORS} />
                          <input type="number" value={cfg.value} onChange={e => patch(c, idx, { value: e.target.value })}
                            placeholder="0"
                            className="h-7 px-2 rounded border text-[12px] outline-none text-center"
                            style={{ borderColor: colors.borderSubtle, color: colors.textPrimary, width: 64 }} />
                          <div className="flex rounded border overflow-hidden" style={{ borderColor: colors.borderSubtle }}>
                            {(["%", "Rooms"] as const).map(u => (
                              <button key={u} type="button" onClick={() => patch(c, idx, { unit: u })}
                                className="px-2.5 h-7 text-[12px]"
                                style={{ backgroundColor: cfg.unit === u ? colors.primary : colors.white, color: cfg.unit === u ? colors.white : colors.textSecondary }}>
                                {u}
                              </button>
                            ))}
                          </div>
                          <span className="text-[12px]" style={{ color: colors.textSecondary }}>booked in</span>
                          <InlineSelect value={cfg.onDay} onChange={v => patch(c, idx, { onDay: v })} options={PICKUP_WINDOWS} />
                        </>
                      ) : (
                        // Standard criteria
                        <>
                          <InlineSelect value={cfg.operator} onChange={v => patch(c, idx, { operator: v })} options={OPERATORS} />
                          <input type="number" value={cfg.value} onChange={e => patch(c, idx, { value: e.target.value })}
                            placeholder="0"
                            className="h-7 px-2 rounded border text-[12px] outline-none text-center"
                            style={{ borderColor: colors.borderSubtle, color: colors.textPrimary, width: 64 }} />
                          {c !== "Days Before Arrival" ? (
                            <div className="flex rounded border overflow-hidden" style={{ borderColor: colors.borderSubtle }}>
                              {(["%", "Rooms"] as const).map(u => (
                                <button key={u} type="button" onClick={() => patch(c, idx, { unit: u })}
                                  className="px-2.5 h-7 text-[12px]"
                                  style={{ backgroundColor: cfg.unit === u ? colors.primary : colors.white, color: cfg.unit === u ? colors.white : colors.textSecondary }}>
                                  {u}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[12px]" style={{ color: colors.textSecondary }}>days before arrival</span>
                          )}
                          {(c === "Demand Occupancy" || c === "OTB") && (
                            <>
                              <span className="text-[12px]" style={{ color: colors.textSecondary }}>on</span>
                              <InlineSelect value={cfg.onDay} onChange={v => patch(c, idx, { onDay: v })} options={ON_DAYS} />
                            </>
                          )}
                        </>
                      )}

                      {conditions.length > 1 && (
                        <button type="button" onClick={() => removeCondition(c, idx)}
                          className="h-7 w-7 flex items-center justify-center rounded text-[16px] hover:bg-gray-100 transition-colors"
                          style={{ color: colors.textSecondary }}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}

                  <button type="button" onClick={() => addCondition(c)}
                    className="mt-3 text-[12px] hover:underline flex items-center gap-1"
                    style={{ color: colors.primary }}>
                    + Add condition
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phase 4: Set Restrictions ────────────────────────────────────────────────

function Phase4({ name, hotelGroup, strategyFor, selectedSegments, selectedRoomTypes, stayDateSummary, criteriaSummary, checked, setChecked, values, setValues }: {
  name: string; hotelGroup: string; strategyFor: StrategyFor;
  selectedSegments: string[]; selectedRoomTypes: string[];
  stayDateSummary: string; criteriaSummary: string;
  checked: Record<string, boolean>; setChecked: (v: Record<string, boolean>) => void;
  values: Record<string, string>; setValues: (v: Record<string, string>) => void;
}) {
  const strategyLabel = strategyFor === "Property" ? "Property"
    : strategyFor === "Yield Segments"
    ? (selectedSegments.length ? `Yield Segments: ${selectedSegments.join(", ")}` : "Yield Segments (none selected)")
    : (selectedRoomTypes.length ? `Room Type: ${selectedRoomTypes.join(", ")}` : "Room Type (none selected)");

  const disabled = getDisabledRestrictions(checked);

  function handleCheck(key: RestrictionType) {
    const newChecked = { ...checked, [key]: !checked[key] };
    const nowDisabled = getDisabledRestrictions(newChecked);
    for (const k of Array.from(nowDisabled)) newChecked[k] = false;
    setChecked(newChecked);
  }

  return (
    <div>
      <div className="rounded mb-6 p-4" style={{ backgroundColor: colors.surfaceBg, border: `1px solid ${colors.border}` }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: colors.textDisabled }}>Summary</p>
        {[
          { label: "Name",        val: name || "—" },
          { label: "Hotel Group", val: hotelGroup },
          { label: "Strategy",    val: strategyLabel },
          { label: "Stay Date",   val: stayDateSummary },
          { label: "Criteria",    val: criteriaSummary },
        ].map(({ label, val }) => (
          <div key={label} className="flex gap-2 mb-1">
            <span className="text-[12px] shrink-0 text-right" style={{ color: colors.textDisabled, width: 80 }}>{label}:</span>
            <span className="text-[13px]" style={{ color: colors.textPrimary }}>{val}</span>
          </div>
        ))}
      </div>

      <p className="text-[13px] font-semibold mb-3" style={{ color: colors.textPrimary }}>Select restrictions</p>
      <div className="flex flex-col gap-3">
        {RESTRICTIONS.map(r => {
          const on = checked[r.key] ?? false;
          const isDisabled = disabled.has(r.key);
          return (
            <div key={r.key} className="rounded border p-4"
              style={{
                borderColor: on ? colors.primary : colors.border,
                backgroundColor: isDisabled ? colors.pageBg : colors.white,
                opacity: isDisabled ? 0.5 : 1,
              }}>
              <label className={`flex items-start gap-3 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                <input type="checkbox" checked={on} disabled={isDisabled}
                  onChange={() => handleCheck(r.key)}
                  className={`w-4 h-4 shrink-0 mt-0.5 accent-[${colors.primary}]`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold leading-tight" style={{ color: colors.textPrimary }}>{r.label}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold"
                      style={{ backgroundColor: colors.chipProperty, color: colors.primary }}>
                      {r.key}
                    </span>
                  </div>
                  <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: colors.textSecondary }}>
                    {RESTRICTION_SUBTEXTS[r.key]}
                  </p>
                </div>
              </label>
              {on && r.hasValue && (
                <div className="mt-3 flex items-center gap-1.5" style={{ marginLeft: 28 }}>
                  <input type="number" value={values[r.key] ?? ""} onChange={e => setValues({ ...values, [r.key]: e.target.value })}
                    placeholder="0" min="1"
                    className="h-8 px-2 rounded border text-[13px] text-center outline-none"
                    style={{ borderColor: colors.primary, color: colors.textPrimary, width: 64 }} />
                  <span className="text-[12px]" style={{ color: colors.textSecondary }}>nights</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewRestrictionV1Page() {
  const router = useRouter();
  const { rules, addRule } = useRestrictions();
  const [step, setStep] = useState(0);
  const [showCoachmarks, setShowCoachmarks] = useState(false);

  const [name, setName] = useState("");
  const [hotelGroup, setHotelGroup] = useState(HOTEL_GROUPS[0]);
  const [strategyFor, setStrategyFor] = useState<StrategyFor>("Property");
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [useTemplate, setUseTemplate] = useState(false);

  const [days, setDays] = useState<Record<DayKey, boolean>>({ ...ALL_DAYS_ON });
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [seasonalStartMonth, setSeasonalStartMonth] = useState("January");
  const [seasonalStartDay, setSeasonalStartDay] = useState("1");
  const [seasonalEndMonth, setSeasonalEndMonth] = useState("December");
  const [seasonalEndDay, setSeasonalEndDay] = useState("31");
  const [selectedEvent, setSelectedEvent] = useState("");

  const [criteriaEnabled, setCriteriaEnabled] = useState<Record<string, boolean>>({});
  const [criteriaConfigs, setCriteriaConfigs] = useState<Record<string, CriteriaConfig[]>>({});

  const [checkedRestrictions, setCheckedRestrictions] = useState<Record<string, boolean>>({});
  const [restrictionValues, setRestrictionValues] = useState<Record<string, string>>({});

  function handleTemplateSelect(rule: GuidelineRule) {
    const newChecked: Record<string, boolean> = {};
    const newValues: Record<string, string> = {};
    for (const r of rule.restrictions) {
      newChecked[r.type] = true;
      if (r.value !== undefined) newValues[r.type] = String(r.value);
    }
    setCheckedRestrictions(newChecked);
    setRestrictionValues(newValues);
  }

  function buildStayDate(): string {
    const activeDays = DAY_KEYS.filter(d => days[d]);
    const dayStr = activeDays.length === 7 ? "All days" : activeDays.length === 0 ? "No days" : activeDays.join(", ");
    if (timePeriod === "all") return `All time (${dayStr})`;
    if (timePeriod === "daterange") return dateStart && dateEnd ? `${dateStart} – ${dateEnd} (${dayStr})` : `Date range (${dayStr})`;
    if (timePeriod === "seasonal") return `${seasonalStartMonth} ${seasonalStartDay} – ${seasonalEndMonth} ${seasonalEndDay} annually (${dayStr})`;
    if (timePeriod === "event") {
      const ev = MOCK_EVENTS.find(e => e.name === selectedEvent);
      return selectedEvent && ev
        ? `${selectedEvent}: ${formatEventDate(ev.start)} – ${formatEventDate(ev.end)} (${dayStr})`
        : `Tied to event (${dayStr})`;
    }
    return dayStr;
  }

  function buildCriteria(): string {
    const active = (CRITERIA as readonly string[]).filter(c => criteriaEnabled[c]);
    if (active.length === 0) return "None (applies every day)";
    return active.map(c => {
      const conditions = criteriaConfigs[c] ?? [];
      if (conditions.length === 0) return c;
      const parts = conditions.map(cfg => {
        if (c === "Days Before Arrival") return `${cfg.operator} ${cfg.value || "0"} days`;
        if (c === "Demand Occupancy Change") return `${cfg.value || "0"}${cfg.unit} ${cfg.operator.toLowerCase()} than ${cfg.onDay.toLowerCase()}`;
        if (c === "Pickup") return `${cfg.operator} ${cfg.value || "0"} ${cfg.unit} in ${cfg.onDay.toLowerCase()}`;
        const scope = cfg.scope !== "Property" ? `${cfg.scope} ` : "";
        return `${scope}${cfg.operator} ${cfg.value || "0"} ${cfg.unit}`;
      });
      const label = CRITERIA_LABELS[c as CriteriaKey]?.abbr ?? c;
      return `${label}: ${parts.join(", or ")}`;
    }).join("; ");
  }

  function canProceed(): boolean {
    if (step === 0) {
      if (!name.trim()) return false;
      if (strategyFor === "Yield Segments" && selectedSegments.length === 0) return false;
      if (strategyFor === "Room Type" && selectedRoomTypes.length === 0) return false;
      return true;
    }
    if (step === 1) {
      if (timePeriod === "event" && !selectedEvent) return false;
      return true;
    }
    if (step === 3) return Object.values(checkedRestrictions).some(Boolean);
    return true;
  }

  function handleNext() {
    if (step < 3) { setStep(s => s + 1); return; }
    const segment = strategyFor === "Yield Segments"
      ? (selectedSegments.join(", ") || "OTA - Transient")
      : "Property";
    const roomType = strategyFor === "Room Type"
      ? (selectedRoomTypes.join(", ") || "All Room Types")
      : "All Room Types";
    const restrictions: GuidelineRule["restrictions"] = [];
    for (const r of RESTRICTIONS) {
      if (r.hasValue && checkedRestrictions[r.key] && restrictionValues[r.key]) {
        restrictions.push({ type: r.key, value: parseInt(restrictionValues[r.key]) });
      } else if (!r.hasValue && checkedRestrictions[r.key]) {
        restrictions.push({ type: r.key });
      }
    }
    const now = new Date();
    addRule({
      id: String(Date.now()),
      name: name.trim(), hotelGroup, segment, roomType, restrictions,
      stayDate: buildStayDate(),
      criteria: buildCriteria(),
      created: `You at ${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`,
      active: true,
    });
    router.push("/restrictions-mlp");
  }

  const breadcrumb = [
    "Home",
    "Pricing & Strategy",
    { label: "Restriction Guidelines", href: "/restrictions-mlp" },
    "New guideline",
  ];

  return (
    <CoachmarkContext.Provider value={showCoachmarks}>
      <div className="flex flex-col min-h-screen" style={{ backgroundColor: colors.pageBg }}>
        <AppHeader
          breadcrumb={breadcrumb}
          onHelpClick={() => setShowCoachmarks(v => !v)}
          helpActive={showCoachmarks}
        />

        <div className="flex-1 px-6 py-5 pb-24">
          <StepIndicator step={step} />

          <div className="rounded-lg p-6 mb-5"
            style={{ backgroundColor: colors.white, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <h2 className={`text-[18px] font-bold ${step === 0 ? "mb-1" : "mb-5"}`} style={{ color: colors.textPrimary }}>
              {STEPS[step]}
            </h2>
            {step === 0 && (
              <p className="text-[13px] mb-5" style={{ color: colors.textSecondary }}>
                Guidelines create restriction strategies for all hotels in a group that can only be edited or removed in the guidelines page.
              </p>
            )}
            {step === 0 && (
              <Phase1 name={name} setName={setName} hotelGroup={hotelGroup} setHotelGroup={setHotelGroup}
                strategyFor={strategyFor} setStrategyFor={setStrategyFor}
                selectedSegments={selectedSegments} setSelectedSegments={setSelectedSegments}
                selectedRoomTypes={selectedRoomTypes} setSelectedRoomTypes={setSelectedRoomTypes}
                rules={rules} useTemplate={useTemplate} setUseTemplate={setUseTemplate}
                onTemplateSelect={handleTemplateSelect} />
            )}
            {step === 1 && (
              <Phase2 days={days} setDays={setDays} timePeriod={timePeriod} setTimePeriod={setTimePeriod}
                dateStart={dateStart} setDateStart={setDateStart} dateEnd={dateEnd} setDateEnd={setDateEnd}
                seasonalStartMonth={seasonalStartMonth} setSeasonalStartMonth={setSeasonalStartMonth}
                seasonalStartDay={seasonalStartDay} setSeasonalStartDay={setSeasonalStartDay}
                seasonalEndMonth={seasonalEndMonth} setSeasonalEndMonth={setSeasonalEndMonth}
                seasonalEndDay={seasonalEndDay} setSeasonalEndDay={setSeasonalEndDay}
                selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} />
            )}
            {step === 2 && (
              <Phase3 enabled={criteriaEnabled} setEnabled={setCriteriaEnabled}
                configs={criteriaConfigs} setConfigs={setCriteriaConfigs} />
            )}
            {step === 3 && (
              <Phase4 name={name} hotelGroup={hotelGroup} strategyFor={strategyFor}
                selectedSegments={selectedSegments} selectedRoomTypes={selectedRoomTypes}
                stayDateSummary={buildStayDate()} criteriaSummary={buildCriteria()}
                checked={checkedRestrictions} setChecked={setCheckedRestrictions}
                values={restrictionValues} setValues={setRestrictionValues} />
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 px-6 py-3 border-t"
          style={{ backgroundColor: colors.white, borderColor: colors.border }}>
          <button type="button" onClick={() => router.push("/restrictions-mlp")}
            className="h-9 px-4 rounded text-[14px] hover:bg-black/5 transition-colors"
            style={{ color: colors.textSecondary }}>
            Cancel
          </button>
          <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="h-9 px-4 rounded border text-[14px] disabled:opacity-40 transition-colors"
            style={{ borderColor: colors.borderSubtle, color: colors.textSecondary, backgroundColor: colors.white }}>
            ← Back
          </button>
          <button type="button" onClick={handleNext} disabled={!canProceed()}
            className="h-9 px-6 rounded text-[14px] font-bold transition-colors"
            style={{
              backgroundColor: canProceed() ? colors.primary : colors.chipSegment,
              color: canProceed() ? colors.white : colors.textDisabled,
              cursor: canProceed() ? "pointer" : "not-allowed",
            }}>
            {step === 3 ? "Create Guideline" : "Next →"}
          </button>
        </div>
      </div>
    </CoachmarkContext.Provider>
  );
}
