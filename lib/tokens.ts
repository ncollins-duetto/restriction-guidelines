// Sourced from ~/dev/duetto-frontend/src/core/styles/branding2026Colors.scss
// and themes.ts (color2026 export). Keep in sync when the production palette changes.

export const colors = {
  // Nav
  navBg: "#0E2124",        // brand.teal.grey / grey[900]
  navAccent: "#C4FF45",    // brand.teal[70]

  // Primary action (teal)
  primary: "#006461",      // main.blue[700]
  primaryHover: "#053C3C", // main.blue[900]
  primarySubtle: "#D7F7ED", // main.blue[50] — property chip bg

  // Text
  textPrimary: "#0E2124",  // text.primary
  textSecondary: "#4F5B60", // grey[700] / text.secondary
  textDisabled: "#AEB4BA", // grey[400] / text.disabled

  // Surfaces & borders
  pageBg: "#F5F5F5",       // grey[100]
  surfaceBg: "#FAFAFA",    // common.backgroundDefault
  white: "#FFFFFF",
  border: "#DDE1E2",       // grey[300]
  borderSubtle: "#AEB4BA", // grey[400]

  // Chips
  chipProperty: "#D7F7ED", // main.blue[50]
  chipSegment: "#EAEEEF",  // grey[200]

  // Semantic
  error: "#D32F2F",        // semantic.error[600]
  warningBorder: "hsl(35 90% 50%)",   // sem.warning[700]
  warningText: "hsl(36 100% 23%)",    // sem.warning[800]
  warningBg: "hsl(42 100% 94%)",      // sem.warning[50]

  // Brand
  avatar: "#FF5900",       // brand.orange[500]
} as const;

export const typography = {
  fontFamily: "Lato, sans-serif",
} as const;
