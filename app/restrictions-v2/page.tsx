import Link from "next/link";
import AppHeader from "@/components/AppHeader";

type RestrictionType =
  | "CTS"
  | "CTA"
  | "CTD"
  | "MinSA"
  | "MinST"
  | "MaxSA"
  | "MaxST";

type RestrictionRule = {
  id: string;
  name: string;
  dateRange: string;
  daysOfWeek: string[];
  segments: string[];
  roomTypes: string[];
  restrictions: { type: RestrictionType; value?: number }[];
  status: "Active" | "Inactive";
};

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MOCK_RULES: RestrictionRule[] = [
  {
    id: "1",
    name: "Summer Weekend Min Stay",
    dateRange: "Jun 1 – Aug 31, 2026",
    daysOfWeek: ["Fri", "Sat", "Sun"],
    segments: ["All Segments"],
    roomTypes: ["All Room Types"],
    restrictions: [
      { type: "MinSA", value: 2 },
      { type: "MinST", value: undefined },
    ],
    status: "Active",
  },
  {
    id: "2",
    name: "Holiday CTA Block",
    dateRange: "Dec 23 – Jan 2, 2026",
    daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    segments: ["OTA", "Leisure"],
    roomTypes: ["Standard", "Deluxe"],
    restrictions: [{ type: "CTA" }, { type: "CTD" }],
    status: "Active",
  },
  {
    id: "3",
    name: "Conference Block – Q1",
    dateRange: "Jan 15 – Jan 20, 2026",
    daysOfWeek: ["Mon", "Tue", "Wed", "Thu"],
    segments: ["Corporate"],
    roomTypes: ["All Room Types"],
    restrictions: [{ type: "CTS" }],
    status: "Inactive",
  },
  {
    id: "4",
    name: "Max Stay Shoulder Season",
    dateRange: "Mar 1 – May 31, 2026",
    daysOfWeek: ["Fri", "Sat"],
    segments: ["All Segments"],
    roomTypes: ["Suite"],
    restrictions: [{ type: "MaxSA", value: 7 }],
    status: "Active",
  },
  {
    id: "5",
    name: "Low Demand Min Arrival",
    dateRange: "Nov 1 – Nov 30, 2026",
    daysOfWeek: ["Mon", "Tue", "Wed"],
    segments: ["Leisure", "OTA"],
    roomTypes: ["Standard"],
    restrictions: [{ type: "MinSA", value: 1 }],
    status: "Inactive",
  },
];

function RestrictionBadge({ type, value }: { type: RestrictionType; value?: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold"
      style={{ backgroundColor: "#dce8f5", color: "#1e3a5f" }}
    >
      {type}
      {value !== undefined && <span className="font-normal">={value}</span>}
    </span>
  );
}

function DayDots({ days }: { days: string[] }) {
  return (
    <div className="flex gap-1">
      {DAYS_SHORT.map((d) => (
        <span
          key={d}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={
            days.includes(d)
              ? { backgroundColor: "#006461", color: "#ffffff" }
              : { backgroundColor: "#dde1e2", color: "#4f5b60" }
          }
        >
          {d[0]}
        </span>
      ))}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

export default function RestrictionsV2Page() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        breadcrumb={["Home", "Pricing & Strategy", "Restriction Guidelines V2"]}
      />

      {/* Page content */}
      <div className="flex flex-col flex-1 px-6 py-5">
        {/* Page header */}
        <div
          className="flex items-center justify-between pb-4 mb-4 border-b"
          style={{ borderColor: "#dde1e2" }}
        >
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: "#1a2533" }}>
              Restriction Guidelines
              <span
                className="ml-2 text-[12px] font-normal px-2 py-0.5 rounded"
                style={{ backgroundColor: "#dce8f5", color: "#1e3a5f" }}
              >
                V2
              </span>
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "#4f5b60" }}>
              Define group-level restrictions applied across all properties.
            </p>
          </div>
          <Link
            href="/restrictions-v2/new"
            className="flex items-center gap-1.5 px-4 h-8 rounded text-[13px] font-bold transition-colors"
            style={{ backgroundColor: "#006461", color: "#ffffff" }}
          >
            <PlusIcon />
            New Restriction Rule
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ borderBottom: `2px solid #dde1e2` }}>
                {["Rule Name", "Date Range", "Days of Week", "Segments", "Room Types", "Restrictions", "Status"].map(
                  (col) => (
                    <th
                      key={col}
                      className="text-left py-2.5 pr-4 font-bold text-[12px] uppercase tracking-wide whitespace-nowrap"
                      style={{ color: "#4f5b60" }}
                    >
                      {col}
                    </th>
                  )
                )}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {MOCK_RULES.map((rule, i) => (
                <tr
                  key={rule.id}
                  className="group hover:bg-[#f5f9ff] transition-colors"
                  style={{
                    borderBottom: `1px solid #dde1e2`,
                    backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa",
                  }}
                >
                  {/* Name */}
                  <td className="py-3 pr-4 font-bold" style={{ color: "#1a2533" }}>
                    {rule.name}
                  </td>

                  {/* Date Range */}
                  <td className="py-3 pr-4 whitespace-nowrap" style={{ color: "#4f5b60" }}>
                    {rule.dateRange}
                  </td>

                  {/* Days of Week */}
                  <td className="py-3 pr-4">
                    <DayDots days={rule.daysOfWeek} />
                  </td>

                  {/* Segments */}
                  <td className="py-3 pr-4" style={{ color: "#4f5b60" }}>
                    {rule.segments.join(", ")}
                  </td>

                  {/* Room Types */}
                  <td className="py-3 pr-4" style={{ color: "#4f5b60" }}>
                    {rule.roomTypes.join(", ")}
                  </td>

                  {/* Restrictions */}
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {rule.restrictions.map((r) => (
                        <RestrictionBadge key={r.type} type={r.type} value={r.value} />
                      ))}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 pr-4">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold"
                      style={
                        rule.status === "Active"
                          ? { backgroundColor: "#e6f4f1", color: "#006461" }
                          : { backgroundColor: "#f0f0f0", color: "#4f5b60" }
                      }
                    >
                      {rule.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/restrictions-v2/${rule.id}/edit`}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#dce8f5] transition-colors"
                        title="Edit"
                      >
                        <EditIcon />
                      </Link>
                      <button
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#fdecea] transition-colors"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {MOCK_RULES.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: "#4f5b60" }}>
              <p className="text-[15px] font-bold mb-1">No restriction rules yet</p>
              <p className="text-[13px]">Create your first rule to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#4f5b60">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#c0392b">
      <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}
