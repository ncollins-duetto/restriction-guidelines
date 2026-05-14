"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { colors } from "@/lib/tokens";
import type { RestrictionType, GuidelineRule } from "@/lib/types";
import { HOTEL_GROUPS, SEGMENTS, ROOM_TYPES } from "@/lib/data";
import { useRestrictions } from "@/lib/restrictions-context";

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

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z" />
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

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
      style={{ backgroundColor: active ? colors.primary : colors.border }}
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

// ─── Info tooltip ─────────────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={colors.textDisabled} style={{ cursor: "default" }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
      {show && (
        <div
          className="absolute left-6 top-0 z-50 rounded shadow-lg px-3 py-2 text-[12px] leading-relaxed"
          style={{ backgroundColor: colors.textPrimary, color: colors.white, width: "280px", pointerEvents: "none" }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function RestrictionsContent() {
  const { rules, ruleStates, toggleRule, toast, clearToast } = useRestrictions();
  const searchParams = useSearchParams();
  const groupParam = searchParams.get("group");
  const initialGroup = HOTEL_GROUPS.includes(groupParam ?? "") ? groupParam! : HOTEL_GROUPS[0];
  const [selectedGroup, setSelectedGroup] = useState<string>(initialGroup);
  const [propertySelected, setPropertySelected] = useState(true);
  const [activeSegments, setActiveSegments] = useState<string[]>(SEGMENTS);
  const [activeRoomTypes, setActiveRoomTypes] = useState<string[]>(ROOM_TYPES);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

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

  // All rules for the selected group
  const groupRules = rules.filter((r) => r.hotelGroup === selectedGroup);

  // Property rules: shown when property filter is selected, filtered by status
  const propertyRules = groupRules.filter((rule) => {
    if (rule.segment !== "Property") return false;
    if (!propertySelected) return false;
    if (statusFilter === "active" && !ruleStates[rule.id]) return false;
    if (statusFilter === "inactive" && ruleStates[rule.id]) return false;
    return true;
  });

  // Segment rules: filtered by segment + room type + status
  const filteredSegmentRules = groupRules.filter((rule) => {
    if (rule.segment === "Property") return false;
    if (!activeSegments.includes(rule.segment)) return false;
    if (!activeRoomTypes.includes(rule.roomType)) return false;
    if (statusFilter === "active" && !ruleStates[rule.id]) return false;
    if (statusFilter === "inactive" && ruleStates[rule.id]) return false;
    return true;
  });

  // Counts for segment filter (exclude Property rules)
  const segmentOnlyRules = groupRules.filter((r) => r.segment !== "Property");
  const segmentCounts = SEGMENTS.reduce<Record<string, number>>((acc, seg) => {
    acc[seg] = segmentOnlyRules.filter((r) => r.segment === seg).length;
    return acc;
  }, {});
  const roomTypeCounts = ROOM_TYPES.reduce<Record<string, number>>((acc, rt) => {
    acc[rt] = segmentOnlyRules.filter((r) => r.roomType === rt).length;
    return acc;
  }, {});

  // Group segment rules by segment for display
  const groupedBySegment = SEGMENTS.reduce<Record<string, GuidelineRule[]>>((acc, seg) => {
    acc[seg] = filteredSegmentRules.filter((r) => r.segment === seg);
    return acc;
  }, {});

  const hasAnyContent = propertyRules.length > 0 || filteredSegmentRules.length > 0;

  return (
    <div
      className="flex flex-col flex-1 px-6 py-5"
      style={{ backgroundColor: colors.pageBg }}
    >
      {/* ── Title + actions row ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-bold" style={{ color: colors.textPrimary }}>
            Restriction Guidelines
          </h1>
          <InfoTooltip text="Restriction guidelines define strategies across a hotel group. They can only be edited or removed from this page — any changes apply to all properties in the group." />
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1.5 px-3 h-8 rounded border text-[13px] whitespace-nowrap"
            style={{ borderColor: colors.borderSubtle, color: colors.textSecondary, backgroundColor: colors.white }}
          >
            <DownloadIcon />
            Download
          </button>
          <button
            className="flex items-center gap-1.5 px-3 h-8 rounded border text-[13px] whitespace-nowrap"
            style={{ borderColor: colors.borderSubtle, color: colors.textSecondary, backgroundColor: colors.white }}
          >
            <DownloadIcon />
            Download for All Groups
          </button>
          <Link
            href="/restrictions-mlp/new-v1"
            className="flex items-center gap-1.5 px-4 h-8 rounded text-[13px] font-bold"
            style={{ backgroundColor: colors.primary, color: colors.white }}
          >
            <PlusIcon />
            New
          </Link>
        </div>
      </div>

      {/* ── Content area: filters column + cards ── */}
      <div className="flex flex-1 gap-8">

        {/* Filters column — inline, no background or border */}
        <div className="shrink-0" style={{ width: "188px" }}>

          {/* Hotel Group */}
          <div className="mb-6">
            <p className="text-[13px] font-bold mb-1.5" style={{ color: colors.textPrimary }}>
              Hotel Group
            </p>
            <div className="relative">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="h-8 pl-3 pr-8 rounded border text-[13px] outline-none appearance-none w-full"
                style={{
                  borderColor: colors.borderSubtle,
                  color: colors.textPrimary,
                  backgroundColor: colors.white,
                }}
              >
                {HOTEL_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <span
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: colors.textSecondary }}
              >
                <ChevronDownIcon />
              </span>
            </div>
          </div>

          {/* Property */}
          <div className="mb-6">
            <p className="text-[13px] font-bold mb-1.5" style={{ color: colors.textPrimary }}>
              Property
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={propertySelected}
                onChange={() => setPropertySelected((prev) => !prev)}
                className={`w-4 h-4 rounded accent-[${colors.primary}]`}
              />
              <span className="text-[13px]" style={{ color: colors.textPrimary }}>Property</span>
            </label>
          </div>

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
                    name="status"
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

        {/* ── Cards column ── */}
        <div className="flex-1">
          {!hasAnyContent ? (
            <div
              className="flex flex-col items-center justify-center py-20"
              style={{ color: colors.textDisabled }}
            >
              <p className="text-[15px] font-bold mb-1">No guidelines match current filters</p>
              <p className="text-[13px]">
                Try adjusting the segment, room type, or status filters.
              </p>
            </div>
          ) : (
            <>
              {/* Property section — always shown, not controlled by segment filter */}
              {propertyRules.length > 0 && (
                <div className="mb-8">
                  <SectionDivider label="Property" />
                  <div className="flex flex-col gap-3">
                    {propertyRules.map((rule) => (
                      <GuidelineCard
                        key={rule.id}
                        rule={rule}
                        active={ruleStates[rule.id]}
                        onToggle={() => toggleRule(rule.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Segment sections */}
              {SEGMENTS.map((seg) => {
                const rules = groupedBySegment[seg];
                if (!rules || rules.length === 0) return null;
                return (
                  <div key={seg} className="mb-8">
                    <SectionDivider label={seg} />
                    <div className="flex flex-col gap-3">
                      {rules.map((rule) => (
                        <GuidelineCard
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
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-xl text-[14px] font-semibold flex items-center gap-2"
          style={{ backgroundColor: colors.primary, color: colors.white, whiteSpace: "nowrap" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Guideline Card ───────────────────────────────────────────────────────────

function GuidelineCard({
  rule,
  active,
  onToggle,
}: {
  rule: GuidelineRule;
  active: boolean;
  onToggle: () => void;
}) {
  const isProperty = rule.segment === "Property";
  return (
    <div
      className="rounded group"
      style={{
        backgroundColor: colors.white,
        boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
      }}
    >
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0 mr-4">
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
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100"
              title="Copy"
            >
              <CopyIcon />
            </button>
            <Link
              href={`/restrictions-mlp/${rule.id}/edit`}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100"
              title="Edit"
            >
              <EditIcon />
            </Link>
            <button
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100"
              title="Delete"
            >
              <DeleteIcon />
            </button>
          </div>
          <Toggle active={active} onToggle={onToggle} />
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
