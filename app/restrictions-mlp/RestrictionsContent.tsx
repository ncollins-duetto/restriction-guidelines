"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { colors } from "@/lib/tokens";
import type { RestrictionType, GuidelineRule } from "@/lib/types";
import { HOTEL_GROUPS, SEGMENTS, ROOM_TYPES, MOCK_PROPERTIES_BY_GROUP } from "@/lib/data";
import { useRestrictions } from "@/lib/restrictions-context";
import Select from "@/components/Select";

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

function ChevronDownIcon({ rotated }: { rotated?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{
        transform: rotated ? "rotate(-90deg)" : "rotate(0deg)",
        transition: "transform 150ms",
        display: "block",
      }}
    >
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

// ─── Collapsible filter section ───────────────────────────────────────────────

function FilterSection({
  label,
  sectionKey,
  collapsed,
  onToggle,
  children,
}: {
  label: string;
  sectionKey: string;
  collapsed: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <button
        onClick={() => onToggle(sectionKey)}
        className="flex items-center justify-between w-full mb-1.5"
      >
        <span className="text-base font-medium" style={{ color: colors.textSecondary }}>
          {label}
        </span>
        <span style={{ color: colors.textSecondary }}>
          <ChevronDownIcon rotated={collapsed} />
        </span>
      </button>
      {!collapsed && children}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

type SortBy = "group" | "granularity" | "alpha";

export default function RestrictionsContent() {
  const { rules, ruleStates, toggleRule, toast, clearToast } = useRestrictions();
  const [selectedGroups, setSelectedGroups] = useState<string[]>(HOTEL_GROUPS);
  const [sortBy, setSortBy] = useState<SortBy>("group");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [propertySelected, setPropertySelected] = useState(true);
  const [activeSegments, setActiveSegments] = useState<string[]>(SEGMENTS);
  const [activeRoomTypes, setActiveRoomTypes] = useState<string[]>(ROOM_TYPES);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  function toggleSection(key: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleGroup(group: string) {
    setSelectedGroups((prev) => {
      if (prev.includes(group)) {
        // Prevent deselecting the last group
        if (prev.length === 1) return prev;
        return prev.filter((g) => g !== group);
      }
      return [...prev, group];
    });
  }

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

  // Rules scoped to selected groups
  const visibleRules = rules.filter((r) => selectedGroups.includes(r.hotelGroup));

  // Status check helper
  function statusOk(rule: GuidelineRule) {
    if (statusFilter === "active") return !!ruleStates[rule.id];
    if (statusFilter === "inactive") return !ruleStates[rule.id];
    return true;
  }

  const propertyRules = visibleRules.filter(
    (r) => r.segment === "Property" && propertySelected && statusOk(r)
  );

  const filteredSegmentRules = visibleRules.filter(
    (r) =>
      r.segment !== "Property" &&
      activeSegments.includes(r.segment) &&
      activeRoomTypes.includes(r.roomType) &&
      statusOk(r)
  );

  // Filter counts across all selected groups
  const segmentOnlyRules = visibleRules.filter((r) => r.segment !== "Property");
  const segmentCounts = SEGMENTS.reduce<Record<string, number>>((acc, seg) => {
    acc[seg] = segmentOnlyRules.filter((r) => r.segment === seg).length;
    return acc;
  }, {});
  const roomTypeCounts = ROOM_TYPES.reduce<Record<string, number>>((acc, rt) => {
    acc[rt] = segmentOnlyRules.filter((r) => r.roomType === rt).length;
    return acc;
  }, {});

  const hasAnyContent = propertyRules.length > 0 || filteredSegmentRules.length > 0;

  // ─── Render helpers per sort mode ──────────────────────────────────────────

  function renderByGroup() {
    return (
      <>
        {HOTEL_GROUPS.filter((g) => selectedGroups.includes(g)).map((group) => {
          const groupPropertyRules = propertyRules.filter((r) => r.hotelGroup === group);
          const groupSegmentRules = filteredSegmentRules.filter((r) => r.hotelGroup === group);
          if (groupPropertyRules.length === 0 && groupSegmentRules.length === 0) return null;
          return (
            <div key={group} className="mb-8">
              <SectionDivider label={group} />
              <div className="flex flex-col gap-3">
                {groupPropertyRules.map((rule) => (
                  <GuidelineCard key={rule.id} rule={rule} active={ruleStates[rule.id]} onToggle={() => toggleRule(rule.id)} />
                ))}
                {groupSegmentRules.map((rule) => (
                  <GuidelineCard key={rule.id} rule={rule} active={ruleStates[rule.id]} onToggle={() => toggleRule(rule.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  function renderByGranularity() {
    const groupedBySegment = SEGMENTS.reduce<Record<string, GuidelineRule[]>>((acc, seg) => {
      acc[seg] = filteredSegmentRules.filter((r) => r.segment === seg);
      return acc;
    }, {});

    return (
      <>
        {propertyRules.length > 0 && (
          <div className="mb-8">
            <SectionDivider label="Property" />
            <div className="flex flex-col gap-3">
              {propertyRules.map((rule) => (
                <GuidelineCard key={rule.id} rule={rule} active={ruleStates[rule.id]} onToggle={() => toggleRule(rule.id)} />
              ))}
            </div>
          </div>
        )}
        {SEGMENTS.map((seg) => {
          const segRules = groupedBySegment[seg];
          if (!segRules || segRules.length === 0) return null;
          return (
            <div key={seg} className="mb-8">
              <SectionDivider label={seg} />
              <div className="flex flex-col gap-3">
                {segRules.map((rule) => (
                  <GuidelineCard key={rule.id} rule={rule} active={ruleStates[rule.id]} onToggle={() => toggleRule(rule.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  function renderAlpha() {
    const allRules = [...propertyRules, ...filteredSegmentRules].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return (
      <div className="flex flex-col gap-3">
        {allRules.map((rule) => (
          <GuidelineCard key={rule.id} rule={rule} active={ruleStates[rule.id]} onToggle={() => toggleRule(rule.id)} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 px-6 py-5" style={{ backgroundColor: colors.pageBg }}>
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
            href="/restrictions-mlp/new"
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

        {/* ── Filters column ── */}
        <div className="shrink-0" style={{ width: "188px" }}>

          {/* Hotel Group */}
          <FilterSection
            label="Hotel Group"
            sectionKey="hotelGroup"
            collapsed={collapsedSections.has("hotelGroup")}
            onToggle={toggleSection}
          >
            <>
              <button
                onClick={() =>
                  selectedGroups.length === HOTEL_GROUPS.length
                    ? setSelectedGroups([])
                    : setSelectedGroups(HOTEL_GROUPS)
                }
                className="text-[12px] mb-2 hover:underline"
                style={{ color: colors.primary }}
              >
                {selectedGroups.length === HOTEL_GROUPS.length ? "Deselect All" : "Select All"}
              </button>
              <div className="flex flex-col gap-1.5">
                {HOTEL_GROUPS.map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(g)}
                      onChange={() => toggleGroup(g)}
                      className={`w-4 h-4 rounded accent-[${colors.primary}]`}
                    />
                    <span className="text-[13px] leading-tight" style={{ color: colors.textPrimary }}>{g}</span>
                  </label>
                ))}
              </div>
            </>
          </FilterSection>

          {/* Property */}
          <FilterSection
            label="Property"
            sectionKey="property"
            collapsed={collapsedSections.has("property")}
            onToggle={toggleSection}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={propertySelected}
                onChange={() => setPropertySelected((prev) => !prev)}
                className={`w-4 h-4 rounded accent-[${colors.primary}]`}
              />
              <span className="text-[13px]" style={{ color: colors.textPrimary }}>Property</span>
            </label>
          </FilterSection>

          {/* Segments */}
          <FilterSection
            label="Segments"
            sectionKey="segments"
            collapsed={collapsedSections.has("segments")}
            onToggle={toggleSection}
          >
            <>
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
            </>
          </FilterSection>

          {/* Room Type */}
          <FilterSection
            label="Room Type"
            sectionKey="roomType"
            collapsed={collapsedSections.has("roomType")}
            onToggle={toggleSection}
          >
            <>
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
            </>
          </FilterSection>

          {/* Status */}
          <FilterSection
            label="Status"
            sectionKey="status"
            collapsed={collapsedSections.has("status")}
            onToggle={toggleSection}
          >
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
          </FilterSection>
        </div>

        {/* ── Cards column ── */}
        <div className="flex-1 min-w-0">
          {/* Sort control */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <span className="text-[12px]" style={{ color: colors.textSecondary }}>Sort by:</span>
            <Select
              value={{ group: "Hotel Group", granularity: "Granularity", alpha: "A–Z" }[sortBy]}
              options={["Hotel Group", "Granularity", "A–Z"]}
              onChange={(label) => {
                const map: Record<string, SortBy> = { "Hotel Group": "group", "Granularity": "granularity", "A–Z": "alpha" };
                setSortBy(map[label]);
              }}
              width={148}
            />
          </div>

          {!hasAnyContent ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: colors.textDisabled }}>
              <p className="text-[15px] font-bold mb-1">No guidelines match current filters</p>
              <p className="text-[13px]">Try adjusting the segment, room type, or status filters.</p>
            </div>
          ) : (
            <>
              {sortBy === "group" && renderByGroup()}
              {sortBy === "granularity" && renderByGranularity()}
              {sortBy === "alpha" && renderAlpha()}
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

// ─── Hotels chip + popover ────────────────────────────────────────────────────

function HotelsChip({ group }: { group: string }) {
  const hotels = MOCK_PROPERTIES_BY_GROUP[group] ?? [];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-0.5 text-[12px] hover:underline"
        style={{ color: colors.primary }}
      >
        {hotels.length} {hotels.length === 1 ? "hotel" : "hotels"}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }}
        >
          <path d="M7 10l5 5 5-5H7z" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 z-50 rounded shadow-lg py-2"
          style={{
            top: "calc(100% + 4px)",
            backgroundColor: colors.white,
            border: `1px solid ${colors.border}`,
            minWidth: "220px",
          }}
        >
          <p
            className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: colors.textDisabled }}
          >
            {group}
          </p>
          {hotels.map((h) => (
            <div key={h.name} className="px-3 py-1 text-[13px]" style={{ color: colors.textPrimary }}>
              {h.name}
            </div>
          ))}
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
        <div className="flex flex-col min-w-0 flex-1 mr-4">
          <div className="flex items-center gap-2 flex-wrap">
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
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[12px]" style={{ color: colors.textDisabled }}>{rule.hotelGroup}</span>
            <span className="text-[12px]" style={{ color: colors.border }}>·</span>
            <HotelsChip group={rule.hotelGroup} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100" title="Copy">
              <CopyIcon />
            </button>
            <Link
              href={`/restrictions-mlp/${rule.id}/edit`}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100"
              title="Edit"
            >
              <EditIcon />
            </Link>
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100" title="Delete">
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
