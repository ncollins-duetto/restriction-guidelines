"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type RestrictionType = "CTS" | "CTA" | "CTD" | "MinSA" | "MinST" | "MaxSA" | "MaxST";

type GuidelineRule = {
  id: string;
  name: string;
  hotelCluster: string;
  segment: string;
  roomType: string;
  restrictions: { type: RestrictionType; value?: number }[];
  stayDate: string;
  criteria: string;
  created: string;
  active: boolean;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const HOTEL_CLUSTERS = ["00327803", "B&B Hotels", "Luxury Collection"];
const SEGMENTS = ["OTA - Transient", "Corporate", "Leisure", "All Segments"];
const ROOM_TYPES = ["All Room Types", "Standard", "Deluxe", "Suite"];

const MOCK_RULES: GuidelineRule[] = [
  {
    id: "1",
    name: "Summer Weekend Min Stay",
    hotelCluster: "00327803",
    segment: "OTA - Transient",
    roomType: "All Room Types",
    restrictions: [{ type: "MinSA", value: 2 }],
    stayDate: "Jun 1 – Aug 31, 2026 (Fri–Sun)",
    criteria: "Everyday",
    created: "Nyle Collins at 4/9/2026",
    active: true,
  },
  {
    id: "2",
    name: "Holiday Closure",
    hotelCluster: "00327803",
    segment: "All Segments",
    roomType: "All Room Types",
    restrictions: [{ type: "CTA" }, { type: "CTD" }],
    stayDate: "Dec 23 – Jan 2, 2026 (All days)",
    criteria: "Everyday",
    created: "Nyle Collins at 4/9/2026",
    active: true,
  },
  {
    id: "3",
    name: "Conference Block Q1",
    hotelCluster: "B&B Hotels",
    segment: "Corporate",
    roomType: "Standard",
    restrictions: [{ type: "CTS" }],
    stayDate: "Jan 15 – Jan 20, 2026 (Mon–Thu)",
    criteria: "Everyday",
    created: "Nyle Collins at 4/10/2026",
    active: false,
  },
  {
    id: "4",
    name: "Low Demand Minimum",
    hotelCluster: "B&B Hotels",
    segment: "Leisure",
    roomType: "Deluxe",
    restrictions: [{ type: "MinSA", value: 1 }],
    stayDate: "Nov 1 – Nov 30, 2026 (Mon–Wed)",
    criteria: "Demand occupancy < 50%",
    created: "Nyle Collins at 4/10/2026",
    active: true,
  },
  {
    id: "5",
    name: "Peak Season Max Stay",
    hotelCluster: "Luxury Collection",
    segment: "OTA - Transient",
    roomType: "Suite",
    restrictions: [{ type: "MaxSA", value: 7 }],
    stayDate: "Jul 1 – Aug 31, 2026 (All days)",
    criteria: "Everyday",
    created: "Nyle Collins at 4/11/2026",
    active: true,
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

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#4f5b60">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

// Card rows: two stacked horizontal bands
function CardRowsIcon({ active }: { active: boolean }) {
  const color = active ? "#ffffff" : "#4f5b60";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
      <rect x="3" y="4" width="18" height="7" rx="1" />
      <rect x="3" y="13" width="18" height="7" rx="1" />
    </svg>
  );
}

// List: three horizontal lines
function ListLinesIcon({ active }: { active: boolean }) {
  const color = active ? "#ffffff" : "#4f5b60";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none">
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
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

function KebabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#4f5b60">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
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
      style={{ backgroundColor: active ? "#006461" : "#dde1e2" }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5"
        style={{ transform: active ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function RestrictionsV2Content() {
  const [selectedCluster, setSelectedCluster] = useState<string>(HOTEL_CLUSTERS[0]);
  const [activeSegments, setActiveSegments] = useState<string[]>(SEGMENTS);
  const [activeRoomTypes, setActiveRoomTypes] = useState<string[]>(ROOM_TYPES);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [ruleStates, setRuleStates] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_RULES.map((r) => [r.id, r.active]))
  );
  const [kebabOpen, setKebabOpen] = useState(false);
  const kebabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setKebabOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleSegment(seg: string) {
    setActiveSegments((prev) =>
      prev.includes(seg) ? prev.filter((s) => s !== seg) : [...prev, seg]
    );
  }

  function deselectAllSegments() { setActiveSegments([]); }
  function selectAllSegments() { setActiveSegments(SEGMENTS); }

  function toggleRoomType(rt: string) {
    setActiveRoomTypes((prev) =>
      prev.includes(rt) ? prev.filter((r) => r !== rt) : [...prev, rt]
    );
  }

  function deselectAllRoomTypes() { setActiveRoomTypes([]); }
  function selectAllRoomTypes() { setActiveRoomTypes(ROOM_TYPES); }

  function toggleRule(id: string) {
    setRuleStates((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const filteredRules = MOCK_RULES.filter((rule) => {
    if (rule.hotelCluster !== selectedCluster) return false;
    if (!activeSegments.includes(rule.segment)) return false;
    if (!activeRoomTypes.includes(rule.roomType)) return false;
    if (statusFilter === "active" && !ruleStates[rule.id]) return false;
    if (statusFilter === "inactive" && ruleStates[rule.id]) return false;
    return true;
  });

  const clusterRules = MOCK_RULES.filter((r) => r.hotelCluster === selectedCluster);
  const segmentCounts = SEGMENTS.reduce<Record<string, number>>((acc, seg) => {
    acc[seg] = clusterRules.filter((r) => r.segment === seg).length;
    return acc;
  }, {});
  const roomTypeCounts = ROOM_TYPES.reduce<Record<string, number>>((acc, rt) => {
    acc[rt] = clusterRules.filter((r) => r.roomType === rt).length;
    return acc;
  }, {});

  const groupedBySegment = SEGMENTS.reduce<Record<string, GuidelineRule[]>>((acc, seg) => {
    acc[seg] = filteredRules.filter((r) => r.segment === seg);
    return acc;
  }, {});

  return (
    <div className="flex flex-1">
      {/* ── Sidebar ── */}
      <aside
        className="shrink-0 py-5 px-5 border-r"
        style={{ width: "260px", borderColor: "#dde1e2", backgroundColor: "#fafafa" }}
      >
        {/* Hotel Cluster — moved here from header */}
        <div className="mb-6">
          <p className="text-[15px] font-bold mb-2" style={{ color: "#1a2533" }}>Hotel Cluster</p>
          <div className="relative">
            <select
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
              className="h-8 pl-3 pr-8 rounded border text-[13px] outline-none appearance-none w-full"
              style={{ borderColor: "#9aa5ab", color: "#1a2533", backgroundColor: "#ffffff" }}
            >
              {HOTEL_CLUSTERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "#4f5b60" }}>
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        {/* Segments */}
        <div className="mb-6">
          <p className="text-[15px] font-bold mb-2" style={{ color: "#1a2533" }}>Segments</p>
          <button
            onClick={activeSegments.length === SEGMENTS.length ? deselectAllSegments : selectAllSegments}
            className="text-[13px] mb-2 hover:underline"
            style={{ color: "#006461" }}
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
                    className="w-4 h-4 rounded accent-[#006461]"
                  />
                  <span className="text-[13px]" style={{ color: "#1a2533" }}>{seg}</span>
                </div>
                <span className="text-[12px]" style={{ color: "#9aa5ab" }}>({segmentCounts[seg]})</span>
              </label>
            ))}
          </div>
        </div>

        {/* Room Type */}
        <div className="mb-6">
          <p className="text-[15px] font-bold mb-2" style={{ color: "#1a2533" }}>Room Type</p>
          <button
            onClick={activeRoomTypes.length === ROOM_TYPES.length ? deselectAllRoomTypes : selectAllRoomTypes}
            className="text-[13px] mb-2 hover:underline"
            style={{ color: "#006461" }}
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
                    className="w-4 h-4 rounded accent-[#006461]"
                  />
                  <span className="text-[13px]" style={{ color: "#1a2533" }}>{rt}</span>
                </div>
                <span className="text-[12px]" style={{ color: "#9aa5ab" }}>({roomTypeCounts[rt]})</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-[15px] font-bold mb-2" style={{ color: "#1a2533" }}>Status</p>
          <div className="flex flex-col gap-1.5">
            {(["all", "active", "inactive"] as const).map((val) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status-v2"
                  checked={statusFilter === val}
                  onChange={() => setStatusFilter(val)}
                  className="accent-[#006461]"
                />
                <span className="text-[13px] capitalize" style={{ color: "#1a2533" }}>
                  {val === "all" ? "All" : val === "active" ? "Only Active" : "Only Inactive"}
                </span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col">
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "#dde1e2" }}
        >
          {/* Left: title + kebab */}
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold" style={{ color: "#1a2533" }}>
              Restriction Guidelines
            </h1>

            {/* Kebab menu */}
            <div className="relative" ref={kebabRef}>
              <button
                onClick={() => setKebabOpen((o) => !o)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#f0f0f0] transition-colors"
                title="More options"
              >
                <KebabIcon />
              </button>
              {kebabOpen && (
                <div
                  className="absolute left-0 top-full mt-1 rounded border shadow-md z-20 py-1"
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "#dde1e2",
                    minWidth: "220px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-[#f5f5f5] transition-colors text-left"
                    style={{ color: "#1a2533" }}
                    onClick={() => setKebabOpen(false)}
                  >
                    <DownloadIcon />
                    Download
                  </button>
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-[#f5f5f5] transition-colors text-left"
                    style={{ color: "#1a2533" }}
                    onClick={() => setKebabOpen(false)}
                  >
                    <DownloadIcon />
                    Download for All Clusters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: New button */}
          <Link
            href="/restrictions-v2/new"
            className="flex items-center gap-1.5 px-4 h-8 rounded text-[13px] font-bold"
            style={{ backgroundColor: "#006461", color: "#ffffff" }}
          >
            <PlusIcon />
            New
          </Link>
        </div>

        {/* Card area */}
        <div className="flex-1 px-6 py-5" style={{ backgroundColor: "#f5f5f5" }}>
          {/* View toggle — right-aligned above cards */}
          <div className="flex justify-end mb-4">
            <div
              className="flex rounded overflow-hidden border"
              style={{ borderColor: "#dde1e2", backgroundColor: "#ffffff" }}
            >
              <button
                className="w-9 h-9 flex items-center justify-center transition-colors"
                style={{ backgroundColor: "#006461" }}
                title="Card view"
              >
                <CardRowsIcon active={true} />
              </button>
              <button
                className="w-9 h-9 flex items-center justify-center transition-colors"
                style={{ backgroundColor: "#ffffff" }}
                title="List view"
              >
                <ListLinesIcon active={false} />
              </button>
            </div>
          </div>

          {filteredRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: "#9aa5ab" }}>
              <p className="text-[15px] font-bold mb-1">No guidelines match current filters</p>
              <p className="text-[13px]">Try adjusting the segment, room type, or status filters.</p>
            </div>
          ) : (
            SEGMENTS.map((seg) => {
              const rules = groupedBySegment[seg];
              if (!rules || rules.length === 0) return null;
              return (
                <div key={seg} className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px" style={{ backgroundColor: "#dde1e2" }} />
                    <span
                      className="text-[11px] font-bold uppercase tracking-widest px-2"
                      style={{ color: "#9aa5ab" }}
                    >
                      {seg}
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: "#dde1e2" }} />
                  </div>
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
            })
          )}
        </div>
      </main>
    </div>
  );
}

function GuidelineCard({
  rule,
  active,
  onToggle,
}: {
  rule: GuidelineRule;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded border bg-white group" style={{ borderColor: "#dde1e2" }}>
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0 mr-4">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold shrink-0"
            style={{ backgroundColor: "#e0e7ef", color: "#1a2533" }}
          >
            {rule.segment}
          </span>
          <span className="text-[15px] font-bold truncate" style={{ color: "#1a2533" }}>
            {rule.name}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/restrictions-v2/${rule.id}/edit`}
            className="w-7 h-7 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#dce8f5]"
            title="Edit"
          >
            <EditIcon />
          </Link>
          <Toggle active={active} onToggle={onToggle} />
        </div>
      </div>
      <div className="px-4 pb-3">
        <p className="text-[13px]" style={{ color: "#4f5b60" }}>
          {rule.roomType} — {restrictionSummary(rule.restrictions)}
        </p>
      </div>
      <div className="border-t mx-4" style={{ borderColor: "#f0f0f0" }} />
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
      <span className="text-[12px] w-20 shrink-0 text-right" style={{ color: "#9aa5ab" }}>
        {label}:
      </span>
      <span className="text-[13px]" style={{ color: "#1a2533" }}>
        {value}
      </span>
    </div>
  );
}
