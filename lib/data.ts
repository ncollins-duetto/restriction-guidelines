import type { GuidelineRule, RestrictionDef } from "./types";

export const HOTEL_GROUPS = [
  "Central-North Europe",
  "Western Europe",
  "Southern Europe",
  "Eastern Europe",
];

// Used on the new restriction form — different dataset from the list page
export const NEW_FORM_HOTEL_GROUPS = ["00327803", "B&B Hotels", "Luxury Collection"];

export const SEGMENTS = ["OTA - Transient", "Corporate", "Leisure"];
export const ROOM_TYPES = ["All Room Types", "Standard", "Deluxe", "Suite"];
export const STRATEGY_FOR_OPTIONS = ["Property", "Segment", "Room Type"];

export const RESTRICTIONS: RestrictionDef[] = [
  { key: "CTS", label: "Closed to Stay", hasValue: false },
  { key: "CTA", label: "Closed to Arrival", hasValue: false },
  { key: "CTD", label: "Closed to Departure", hasValue: false },
  { key: "MinST", label: "Min Stay Thru", hasValue: true },
  { key: "MaxST", label: "Max Stay Thru", hasValue: true },
  { key: "MinSA", label: "Min Stay Arrival", hasValue: true },
  { key: "MaxSA", label: "Max Stay Arrival", hasValue: true },
];

export const MOCK_RULES: GuidelineRule[] = [
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
  },
  {
    id: "3",
    name: "Low Demand Minimum",
    hotelGroup: "Central-North Europe",
    segment: "Leisure",
    roomType: "Deluxe",
    restrictions: [{ type: "MinSA", value: 1 }],
    stayDate: "Nov 1 – Nov 30, 2026 (Mon–Wed)",
    criteria: "Demand occupancy < 50%",
    created: "James Thornton at 4/10/2026",
    active: true,
  },
  {
    id: "4",
    name: "Conference Block Q1",
    hotelGroup: "Western Europe",
    segment: "Corporate",
    roomType: "Standard",
    restrictions: [{ type: "CTS" }],
    stayDate: "Jan 15 – Jan 20, 2026 (Mon–Thu)",
    criteria: "Everyday",
    created: "Elena Rossi at 4/10/2026",
    active: false,
  },
  {
    id: "5",
    name: "Peak Season Max Stay",
    hotelGroup: "Western Europe",
    segment: "OTA - Transient",
    roomType: "Suite",
    restrictions: [{ type: "MaxSA", value: 7 }],
    stayDate: "Jul 1 – Aug 31, 2026 (All days)",
    criteria: "Everyday",
    created: "Ana Rodrigues at 4/11/2026",
    active: true,
  },
  {
    id: "6",
    name: "Year-Round Arrival Block",
    hotelGroup: "Southern Europe",
    segment: "Property",
    roomType: "All Room Types",
    restrictions: [{ type: "CTS" }],
    stayDate: "Jan 1 – Dec 31, 2026 (Sat–Sun)",
    criteria: "Everyday",
    created: "Thomas Müller at 4/12/2026",
    active: false,
  },
];
