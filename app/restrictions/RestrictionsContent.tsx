"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type RestrictionType = "CTS" | "CTA" | "CTD" | "MinSA" | "MinST" | "MaxSA" | "MaxST";

type GuidelineRule = {
  id: string;
  name: string;
  hotelGroup: string;
  restrictions: { type: RestrictionType; value?: number }[];
  stayDate: string;
  criteria: string;
  created: string;
  active: boolean;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_RULES: GuidelineRule[] = [
  {
    id: "1",
    name: "Summer Weekend Min Stay",
    hotelGroup: "00327803",
    restrictions: [{ type: "MinSA", value: 2 }],
    stayDate: "Jun 1 – Aug 31, 2026 (Fri–Sun)",
    criteria: "Everyday",
    created: "Nyle Collins at 4/9/2026",
    active: true,
  },
  {
    id: "2",
    name: "Holiday Closure",
    hotelGroup: "00327803",
    restrictions: [{ type: "CTA" }, { type: "CTD" }],
    stayDate: "Dec 23 – Jan 2, 2026 (All days)",
    criteria: "Everyday",
    created: "Nyle Collins at 4/9/2026",
    active: true,
  },
  {
    id: "3",
    name: "Conference Block Q1",
    hotelGroup: "B&B Hotels",
    restrictions: [{ type: "CTS" }],
    stayDate: "Jan 15 – Jan 20, 2026 (Mon–Thu)",
    criteria: "Everyday",
    created: "Nyle Collins at 4/10/2026",
    active: false,
  },
  {
    id: "4",
    name: "Low Demand Minimum",
    hotelGroup: "B&B Hotels",
    restrictions: [{ type: "MinSA", value: 1 }],
    stayDate: "Nov 1 – Nov 30, 2026 (Mon–Wed)",
    criteria: "Demand occupancy < 50%",
    created: "Nyle Collins at 4/10/2026",
    active: true,
  },
  {
    id: "5",
    name: "Peak Season Max Stay",
    hotelGroup: "Luxury Collection",
    restrictions: [{ type: "MaxSA", value: 7 }],
    stayDate: "Jul 1 – Aug 31, 2026 (All days)",
    criteria: "Everyday",
    created: "Nyle Collins at 4/11/2026",
    active: true,
  },
];

const HOTEL_GROUPS = ["00327803", "B&B Hotels", "Luxury Collection"];

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
  return restrictions.map((r) => {
    const label = labels[r.type];
    return r.value !== undefined ? `${label} ${r.value}` : label;
  }).join(", ");
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

function ListViewIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? "#ffffff" : "#4f5b60"}>
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  );
}

function CardViewIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? "#ffffff" : "#4f5b60"}>
      <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
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

export default function RestrictionsContent() {
  const [activeGroups, setActiveGroups] = useState<string[]>(HOTEL_GROUPS);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [ruleStates, setRuleStates] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_RULES.map((r) => [r.id, r.active]))
  );

  function toggleGroup(group: string) {
    setActiveGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  }

  function deselectAll() {
    setActiveGroups([]);
  }

  function toggleRule(id: string) {
    setRuleStates((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const filteredRules = MOCK_RULES.filter((rule) => {
    if (!activeGroups.includes(rule.hotelGroup)) return false;
    if (statusFilter === "active" && !ruleStates[rule.id]) return false;
    if (statusFilter === "inactive" && ruleStates[rule.id]) return false;
    return true;
  });

  const groupedRules = HOTEL_GROUPS.reduce<Record<string, GuidelineRule[]>>((acc, group) => {
    acc[group] = filteredRules.filter((r) => r.hotelGroup === group);
    return acc;
  }, {});

  const ruleCounts = HOTEL_GROUPS.reduce<Record<string, number>>((acc, group) => {
    acc[group] = MOCK_RULES.filter((r) => r.hotelGroup === group).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-1">
      {/* ── Sidebar ── */}
      <aside
        className="shrink-0 py-5 px-5 border-r"
        style={{ width: "260px", borderColor: "#dde1e2", backgroundColor: "#fafafa" }}
      >
        <div className="mb-6">
          <p className="text-[15px] font-bold mb-2" style={{ color: "#1a2533" }}>
            Hotel Groups
          </p>
          <button
            onClick={deselectAll}
            className="text-[13px] mb-2 hover:underline"
            style={{ color: "#006461" }}
          >
            Deselect All
          </button>
          <div className="flex flex-col gap-1.5">
            {HOTEL_GROUPS.map((group) => (
              <label key={group} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={activeGroups.includes(group)}
                    onChange={() => toggleGroup(group)}
                    className="w-4 h-4 rounded accent-[#006461]"
                  />
                  <span className="text-[13px]" style={{ color: "#1a2533" }}>{group}</span>
                </div>
                <span className="text-[12px]" style={{ color: "#9aa5ab" }}>
                  ({ruleCounts[group]})
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[15px] font-bold mb-2" style={{ color: "#1a2533" }}>
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
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#dde1e2" }}>
          <h1 className="text-[22px] font-bold" style={{ color: "#1a2533" }}>
            Restriction Guidelines
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/restrictions/new"
              className="flex items-center gap-1.5 px-4 h-8 rounded text-[13px] font-bold"
              style={{ backgroundColor: "#006461", color: "#ffffff" }}
            >
              <PlusIcon />
              New
            </Link>
            <div className="flex rounded overflow-hidden border" style={{ borderColor: "#dde1e2" }}>
              <button
                className="w-8 h-8 flex items-center justify-center"
                style={{ backgroundColor: "#006461" }}
                title="Card view"
              >
                <CardViewIcon active={true} />
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center"
                style={{ backgroundColor: "#ffffff" }}
                title="List view"
              >
                <ListViewIcon active={false} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 py-5" style={{ backgroundColor: "#f5f5f5" }}>
          {HOTEL_GROUPS.map((group) => {
            const rules = groupedRules[group];
            if (!activeGroups.includes(group)) return null;
            return (
              <div key={group} className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px" style={{ backgroundColor: "#dde1e2" }} />
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest px-2"
                    style={{ color: "#9aa5ab" }}
                  >
                    {group}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "#dde1e2" }} />
                </div>

                {rules.length === 0 ? (
                  <p className="text-[13px] text-center py-6" style={{ color: "#9aa5ab" }}>
                    No rules match current filters.
                  </p>
                ) : (
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
                )}
              </div>
            );
          })}

          {filteredRules.length === 0 && activeGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: "#9aa5ab" }}>
              <p className="text-[15px] font-bold mb-1">No hotel groups selected</p>
              <p className="text-[13px]">Select a group from the sidebar to see guidelines.</p>
            </div>
          )}
        </div>
      </main>
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
  return (
    <div className="rounded border bg-white group" style={{ borderColor: "#dde1e2" }}>
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0 mr-4">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold shrink-0"
            style={{ backgroundColor: "#c4ff45", color: "#0e2124" }}
          >
            {rule.hotelGroup}
          </span>
          <span className="text-[15px] font-bold truncate" style={{ color: "#1a2533" }}>
            {rule.name}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/restrictions/${rule.id}/edit`}
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
          Enterprise Level — {restrictionSummary(rule.restrictions)}
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
