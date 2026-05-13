"use client";

import { useState } from "react";
import Link from "next/link";
import { colors } from "@/lib/tokens";
import type { RestrictionType, GuidelineRule } from "@/lib/types";
import { SEGMENTS, ROOM_TYPES } from "@/lib/data";

type StrategyRule = GuidelineRule & { locked?: boolean; guidelineNote?: boolean };

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_STRATEGY_RULES: StrategyRule[] = [
  {
    id: "1",
    name: "Summer Weekend Min Stay",
    hotelGroup: "Central-North Europe",
    segment: "OTA - Transient",
    roomType: "All Room Types",
    restrictions: [{ type: "MinSA", value: 2 }],
    stayDate: "Jun 1 – Aug 31, 2026 (Fri–Sun)",
    criteria: "Everyday",
    created: "Sophie Laurent at 4/9/2026",
    active: true,
    locked: false,
  },
  {
    id: "2",
    name: "Holiday Closure",
    hotelGroup: "Central-North Europe",
    segment: "Property",
    roomType: "All Room Types",
    restrictions: [{ type: "CTA" }, { type: "CTD" }],
    stayDate: "Dec 23 – Jan 2, 2026 (All days)",
    criteria: "Everyday",
    created: "Marcus Weber at 4/9/2026",
    active: true,
    locked: true,
  },
  {
    id: "3",
    name: "Holiday Closure",
    hotelGroup: "Central-North Europe",
    segment: "Property",
    roomType: "All Room Types",
    restrictions: [{ type: "CTA" }, { type: "CTD" }],
    stayDate: "Dec 23 – Jan 2, 2026 (All days)",
    criteria: "Everyday",
    created: "Marcus Weber at 4/9/2026",
    active: true,
    locked: true,
    guidelineNote: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function restrictionSummary(restrictions: GuidelineRule["restrictions"]): string {
  const labels: Record<RestrictionType, string> = {
    CTS: "Closed to Stay",
    CTA: "Closed to Arrival",
    CTD: "Closed to Departure",
    MinSA: "Min Stay Arrival",
    MinST: "Min Stay Thru",
    MaxSA: "Max Stay Arrival",
    MaxST: "Max Stay Thru",
  };
  return restrictions
    .map((r) => {
      const label = labels[r.type];
      return r.value !== undefined ? `${label} ${r.value}` : label;
    })
    .join(", ");
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.textSecondary}>
      <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.textSecondary}>
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.textSecondary}>
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.textDisabled}>
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
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

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  active,
  onToggle,
  disabled,
}: {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
      style={{
        backgroundColor: disabled ? colors.border : active ? colors.primary : colors.border,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5"
        style={{ transform: active ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
      <span
        className="text-[11px] font-bold uppercase tracking-widest px-2"
        style={{ color: colors.textDisabled }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
    </div>
  );
}

// ─── Strategy Card ────────────────────────────────────────────────────────────

function StrategyCard({
  rule,
  active,
  onToggle,
}: {
  rule: StrategyRule;
  active: boolean;
  onToggle: () => void;
}) {
  const locked = !!rule.locked;
  const isProperty = rule.segment === "Property";

  return (
    <div
      className="rounded group"
      style={{
        backgroundColor: locked ? "#EBEBEB" : colors.white,
        boxShadow: locked
          ? "none"
          : "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
        border: locked ? `1px solid ${colors.border}` : "none",
      }}
    >
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0 mr-4">
          {locked && <LockIcon />}
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold shrink-0"
            style={
              isProperty
                ? { backgroundColor: colors.chipProperty, color: colors.primary }
                : { backgroundColor: colors.chipSegment, color: colors.textPrimary }
            }
          >
            {rule.segment}
          </span>
          <span className="text-[15px] font-bold truncate" style={{ color: colors.textPrimary }}>
            {rule.name}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!locked && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100"
                title="Copy"
              >
                <CopyIcon />
              </button>
              <button
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100"
                title="Edit"
              >
                <EditIcon />
              </button>
              <button
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100"
                title="Delete"
              >
                <DeleteIcon />
              </button>
            </div>
          )}
          <Toggle active={active} onToggle={onToggle} disabled={locked} />
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-[13px]" style={{ color: colors.textSecondary }}>
          {rule.roomType} — {restrictionSummary(rule.restrictions)}
        </p>
      </div>

      <div className="border-t mx-4" style={{ borderColor: colors.border }} />

      <div className="px-4 py-3 flex flex-col gap-1.5">
        <DetailRow label="Stay Date" value={rule.stayDate} />
        <DetailRow label="Criteria" value={rule.criteria} />
        <DetailRow label="Created" value={rule.created} />
      </div>

      {rule.guidelineNote && (
        <>
          <div className="border-t mx-4" style={{ borderColor: colors.border }} />
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <LockIcon />
              <span className="text-[12px]" style={{ color: colors.textSecondary }}>
                Guideline set for the hotel group — can only be edited in
              </span>
              <Link
                href="/restrictions"
                className="text-[12px] font-bold hover:underline"
                style={{ color: colors.primary }}
              >
                Restriction Guidelines
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[12px] w-20 shrink-0 text-right" style={{ color: colors.textDisabled }}>
        {label}:
      </span>
      <span className="text-[13px]" style={{ color: colors.textPrimary }}>
        {value}
      </span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StrategyContent() {
  const [activeSegments, setActiveSegments] = useState<string[]>(SEGMENTS);
  const [activeRoomTypes, setActiveRoomTypes] = useState<string[]>(ROOM_TYPES);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [ruleStates, setRuleStates] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_STRATEGY_RULES.map((r) => [r.id, r.active]))
  );

  function toggleSegment(seg: string) {
    setActiveSegments((prev) =>
      prev.includes(seg) ? prev.filter((s) => s !== seg) : [...prev, seg]
    );
  }

  function toggleRoomType(rt: string) {
    setActiveRoomTypes((prev) =>
      prev.includes(rt) ? prev.filter((r) => r !== rt) : [...prev, rt]
    );
  }

  function toggleRule(id: string) {
    setRuleStates((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const propertyRules = MOCK_STRATEGY_RULES.filter((rule) => {
    if (rule.segment !== "Property") return false;
    if (statusFilter === "active" && !ruleStates[rule.id]) return false;
    if (statusFilter === "inactive" && ruleStates[rule.id]) return false;
    return true;
  });

  const filteredSegmentRules = MOCK_STRATEGY_RULES.filter((rule) => {
    if (rule.segment === "Property") return false;
    if (!activeSegments.includes(rule.segment)) return false;
    if (!activeRoomTypes.includes(rule.roomType)) return false;
    if (statusFilter === "active" && !ruleStates[rule.id]) return false;
    if (statusFilter === "inactive" && ruleStates[rule.id]) return false;
    return true;
  });

  const segmentOnlyRules = MOCK_STRATEGY_RULES.filter((r) => r.segment !== "Property");
  const segmentCounts = SEGMENTS.reduce<Record<string, number>>((acc, seg) => {
    acc[seg] = segmentOnlyRules.filter((r) => r.segment === seg).length;
    return acc;
  }, {});
  const roomTypeCounts = ROOM_TYPES.reduce<Record<string, number>>((acc, rt) => {
    acc[rt] = segmentOnlyRules.filter((r) => r.roomType === rt).length;
    return acc;
  }, {});

  const groupedBySegment = SEGMENTS.reduce<Record<string, StrategyRule[]>>((acc, seg) => {
    acc[seg] = filteredSegmentRules.filter((r) => r.segment === seg);
    return acc;
  }, {});

  const hasAnyContent = propertyRules.length > 0 || filteredSegmentRules.length > 0;

  return (
    <div
      className="flex flex-col flex-1 px-6 py-5"
      style={{ backgroundColor: colors.pageBg }}
    >
      {/* Title + actions */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[22px] font-bold" style={{ color: colors.textPrimary }}>
          Restriction Strategy
        </h1>
        <Link
          href="#"
          className="flex items-center gap-1.5 px-4 h-8 rounded text-[13px] font-bold"
          style={{ backgroundColor: colors.primary, color: colors.white }}
        >
          <PlusIcon />
          New
        </Link>
      </div>

      {/* Sidebar + cards */}
      <div className="flex flex-1 gap-8">

        {/* Filters */}
        <div className="shrink-0" style={{ width: "188px" }}>

          {/* Segments */}
          <div className="mb-6">
            <p className="text-[13px] font-bold mb-1.5" style={{ color: colors.textPrimary }}>
              Segments
            </p>
            <button
              onClick={() =>
                activeSegments.length === SEGMENTS.length
                  ? setActiveSegments([])
                  : setActiveSegments(SEGMENTS)
              }
              className="text-[12px] mb-2 hover:underline"
              style={{ color: colors.primary }}
            >
              {activeSegments.length === SEGMENTS.length ? "Deselect All" : "Select All"}
            </button>
            <div className="flex flex-col gap-1.5">
              {SEGMENTS.map((seg) => (
                <label key={seg} className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={activeSegments.includes(seg)}
                      onChange={() => toggleSegment(seg)}
                      className={`w-4 h-4 rounded accent-[${colors.primary}]`}
                    />
                    <span className="text-[13px]" style={{ color: colors.textPrimary }}>{seg}</span>
                  </div>
                  <span className="text-[12px]" style={{ color: colors.textDisabled }}>
                    ({segmentCounts[seg]})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Room Type */}
          <div className="mb-6">
            <p className="text-[13px] font-bold mb-1.5" style={{ color: colors.textPrimary }}>
              Room Type
            </p>
            <button
              onClick={() =>
                activeRoomTypes.length === ROOM_TYPES.length
                  ? setActiveRoomTypes([])
                  : setActiveRoomTypes(ROOM_TYPES)
              }
              className="text-[12px] mb-2 hover:underline"
              style={{ color: colors.primary }}
            >
              {activeRoomTypes.length === ROOM_TYPES.length ? "Deselect All" : "Select All"}
            </button>
            <div className="flex flex-col gap-1.5">
              {ROOM_TYPES.map((rt) => (
                <label key={rt} className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={activeRoomTypes.includes(rt)}
                      onChange={() => toggleRoomType(rt)}
                      className={`w-4 h-4 rounded accent-[${colors.primary}]`}
                    />
                    <span className="text-[13px]" style={{ color: colors.textPrimary }}>{rt}</span>
                  </div>
                  <span className="text-[12px]" style={{ color: colors.textDisabled }}>
                    ({roomTypeCounts[rt]})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-[13px] font-bold mb-1.5" style={{ color: colors.textPrimary }}>
              Status
            </p>
            <div className="flex flex-col gap-1.5">
              {(["all", "active", "inactive"] as const).map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy-status"
                    checked={statusFilter === val}
                    onChange={() => setStatusFilter(val)}
                    className={`accent-[${colors.primary}]`}
                  />
                  <span className="text-[13px]" style={{ color: colors.textPrimary }}>
                    {val === "all" ? "All" : val === "active" ? "Only Active" : "Only Inactive"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex-1">
          {!hasAnyContent ? (
            <div
              className="flex flex-col items-center justify-center py-20"
              style={{ color: colors.textDisabled }}
            >
              <p className="text-[15px] font-bold mb-1">No rules match current filters</p>
              <p className="text-[13px]">Try adjusting the segment, room type, or status filters.</p>
            </div>
          ) : (
            <>
              {propertyRules.length > 0 && (
                <div className="mb-8">
                  <SectionDivider label="Property" />
                  <div className="flex flex-col gap-3">
                    {propertyRules.map((rule) => (
                      <StrategyCard
                        key={rule.id}
                        rule={rule}
                        active={ruleStates[rule.id]}
                        onToggle={() => toggleRule(rule.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {SEGMENTS.map((seg) => {
                const rules = groupedBySegment[seg];
                if (!rules || rules.length === 0) return null;
                return (
                  <div key={seg} className="mb-8">
                    <SectionDivider label={seg} />
                    <div className="flex flex-col gap-3">
                      {rules.map((rule) => (
                        <StrategyCard
                          key={rule.id}
                          rule={rule}
                          active={ruleStates[rule.id]}
                          onToggle={() => toggleRule(rule.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
