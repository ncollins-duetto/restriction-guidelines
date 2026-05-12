"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { colors, typography } from "@/lib/tokens";

const LOGO_URL = "/duetto-logo.svg";

// ─── Mega-menu structure ────────────────────────────────────────────────────
// Matches the production Pricing & Strategy mega-menu exactly.
// Flat columns with no sub-section headers. Only "Restriction Guidelines"
// in Multi-Property is a live link; everything else is a non-linked placeholder.

type MegaMenuItem = { label: string; href?: string };
type MegaMenuColumn = { header: string; items: MegaMenuItem[] };

const PRICING_STRATEGY_MENU: MegaMenuColumn[] = [
  {
    header: "Manage",
    items: [
      { label: "Rates" },
      { label: "Rates (7 Day View)" },
      { label: "Yielding" },
      { label: "Room Type Rates" },
      { label: "Restrictions" },
      { label: "Product Level Restrictions" },
      { label: "Overbooking" },
      { label: "Out Of Order Rooms" },
      { label: "Events" },
    ],
  },
  {
    header: "Configure",
    items: [
      { label: "Pricing Strategy" },
      { label: "Restriction Strategy", href: "/restriction-strategy" },
      { label: "Forecast Rules" },
      { label: "Autopilot" },
      { label: "Min/Max Bounds" },
      { label: "Sub Rates" },
    ],
  },
  {
    header: "Multi-Property",
    items: [
      { label: "Rate Guidelines" },
      { label: "Restriction Guidelines", href: "/restrictions" },
      { label: "Hotel Groups" },
      { label: "Sub Rates" },
    ],
  },
  {
    header: "Review",
    items: [
      { label: "Rate Change Activity" },
      { label: "Restriction Change Activity" },
      { label: "Pricing Visibility" },
    ],
  },
];

type NavItem = {
  label: string;
  hasDropdown?: boolean;
  active?: boolean;
  menu?: MegaMenuColumn[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home" },
  { label: "Advance" },
  { label: "Pricing & Strategy", hasDropdown: true, active: true, menu: PRICING_STRATEGY_MENU },
  { label: "Forecasts & Budgets", hasDropdown: true },
  { label: "Reports", hasDropdown: true },
  { label: "Groups", hasDropdown: true },
  { label: "Onboarding" },
];

// ─── Icons ──────────────────────────────────────────────────────────────────

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
    </svg>
  );
}

function NotificationsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
    </svg>
  );
}

function AvatarIcon() {
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center"
      style={{ backgroundColor: colors.avatar }}
    >
      <span className="text-white text-[10px] font-bold leading-none">N</span>
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={colors.primary}>
      <path d="M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5v-2h2v2zm4 4H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2z" />
    </svg>
  );
}

// ─── Mega-menu dropdown ──────────────────────────────────────────────────────

function MegaMenu({ columns, onClose }: { columns: MegaMenuColumn[]; onClose: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "40px",
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        backgroundColor: colors.white,
        borderTop: `2px solid ${colors.navAccent}`,
        borderBottom: `1px solid ${colors.border}`,
        padding: "20px 24px",
        gap: "40px",
      }}
    >
      {columns.map((col) => (
        <div key={col.header} style={{ minWidth: "160px" }}>
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: colors.textSecondary }}
          >
            {col.header}
          </p>
          <div className="flex flex-col gap-0.5">
            {col.items.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className="text-[13px] py-0.5 font-bold"
                  style={{ color: colors.primary }}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  key={item.label}
                  className="text-[13px] py-0.5"
                  style={{ color: colors.primary }}
                >
                  {item.label}
                </span>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

type BreadcrumbItem = string | { label: string; href: string };

type AppHeaderProps = {
  breadcrumb?: BreadcrumbItem[];
  propertyName?: string;
};

export default function AppHeader({
  breadcrumb = ["Home", "Pricing & Strategy", "Restriction Guidelines"],
  propertyName = "All Properties",
}: AppHeaderProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleMenu(label: string, hasMenu: boolean) {
    if (!hasMenu) return;
    setOpenMenu((prev) => (prev === label ? null : label));
  }

  return (
    <header ref={headerRef} className="w-full relative z-40" style={{ fontFamily: typography.fontFamily }}>
      {/* Top nav bar */}
      <div
        className="flex items-center gap-4 h-10 px-6"
        style={{ backgroundColor: colors.navBg }}
      >
        {/* Duetto logo */}
        <div className="shrink-0 h-[15px] w-[72px]">
          <img src={LOGO_URL} alt="Duetto" className="h-full w-auto" />
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 h-10">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => toggleMenu(item.label, !!item.menu)}
              className="flex items-center gap-0.5 h-10 px-4 text-[13px] shrink-0 cursor-pointer transition-colors"
              style={
                item.active
                  ? { backgroundColor: colors.navAccent, color: colors.navBg }
                  : { color: colors.white }
              }
            >
              {item.label}
              {item.hasDropdown && (
                <span style={item.active ? { color: colors.navBg } : { color: colors.white }}>
                  <ChevronDownIcon />
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-3 shrink-0">
          <button className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
            <NotificationsIcon />
            <span className="absolute top-0.5 right-0.5 bg-red-600 text-white text-[8px] rounded-full px-0.5 leading-none py-px">
              4
            </span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
            <HelpIcon />
          </button>
          <div className="relative">
            <button
              onClick={() => { setSettingsOpen((p) => !p); setOpenMenu(null); }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              <SettingsIcon />
            </button>
            {settingsOpen && (
              <div
                className="absolute right-0 top-9 z-50 rounded shadow-lg py-1"
                style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, minWidth: "200px" }}
              >
                <p
                  className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: colors.textSecondary }}
                >
                  Design Alts
                </p>
                <Link
                  href="/restrictions-v2"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center px-3 py-1.5 text-[13px] hover:bg-[#f5f9ff]"
                  style={{ color: colors.primary }}
                >
                  Restriction Guidelines V2
                </Link>
                <Link
                  href="/restrictions-v3"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center px-3 py-1.5 text-[13px] hover:bg-[#f5f9ff]"
                  style={{ color: colors.primary }}
                >
                  Restriction Guidelines V3
                </Link>
              </div>
            )}
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
            <AvatarIcon />
          </button>
        </div>
      </div>

      {/* Mega-menu — rendered at header level so left:0/right:0 spans full width */}
      {openMenu && NAV_ITEMS.find(i => i.label === openMenu)?.menu && (
        <MegaMenu
          columns={NAV_ITEMS.find(i => i.label === openMenu)!.menu!}
          onClose={() => setOpenMenu(null)}
        />
      )}

      {/* Breadcrumb + property picker bar */}
      <div
        className="flex items-center justify-between h-8 pl-6 border-b"
        style={{ backgroundColor: colors.surfaceBg, borderColor: colors.border }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-1">
          {breadcrumb.map((crumb, i) => {
            const label = typeof crumb === "string" ? crumb : crumb.label;
            const href = typeof crumb === "string" ? undefined : crumb.href;
            const isLast = i === breadcrumb.length - 1;
            return (
              <span key={label} className="flex items-center gap-1">
                {i > 0 && (
                  <span style={{ color: colors.textSecondary }}>
                    <ChevronRightIcon />
                  </span>
                )}
                {href ? (
                  <Link
                    href={href}
                    className="text-[12px] hover:underline"
                    style={{ color: colors.primary }}
                  >
                    {label}
                  </Link>
                ) : (
                  <span
                    className="text-[12px]"
                    style={{ color: isLast ? colors.textSecondary : colors.primary }}
                  >
                    {label}
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {/* Property picker — disabled/non-interactive in prototype */}
        <div
          className="flex items-center gap-2 h-8 px-2 w-[312px] border-l"
          style={{ borderColor: colors.border, cursor: "default", opacity: 0.5 }}
        >
          <BuildingIcon />
          <span className="flex-1 text-[13px] truncate" style={{ color: colors.primary }}>
            {propertyName}
          </span>
          <span style={{ color: colors.textSecondary }}>
            <ChevronDownIcon />
          </span>
        </div>
      </div>
    </header>
  );
}
