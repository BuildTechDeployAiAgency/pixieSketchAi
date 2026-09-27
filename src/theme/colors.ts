/**
 * Centralized color tokens for PixieSketch Mobile.
 *
 * These match the Tailwind config (tailwind.config.js) so NativeWind className
 * and StyleSheet usage stay in sync. Update both when changing brand colors.
 */

export const colors = {
  /* ── Brand ── */
  primary: {
    DEFAULT: "#7c3aed",
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
  },

  /* ── Semantic ── */
  success: "#16a34a",
  successLight: "#f0fdf4",
  warning: "#f59e0b",
  warningDark: "#92400e",
  warningLight: "#fcd34d",
  error: "#ef4444",

  /* ── Neutrals ── */
  white: "#ffffff",
  black: "#000000",
  background: "#f5f7fa",

  gray: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e8ecf1",
    300: "#dfe7f0",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#111827",
  },

  /* ── Preset accent colors ── */
  preset: {
    cartoon: "#3b82f6",
    pixar: "#f97316",
    realistic: "#16a34a",
  },

  /* ── Payment tier colors ── */
  tier: {
    starter: "#3b82f6",
    popular: "#7c3aed",
    pro: "#f59e0b",
  },

  /* ── Overlays ── */
  overlay: {
    dark: "rgba(0,0,0,0.5)",
    backdrop: "rgba(15, 23, 42, 0.5)",
    whiteSubtle: "rgba(255,255,255,0.18)",
    whiteMedium: "rgba(255,255,255,0.22)",
    whiteStrong: "rgba(255,255,255,0.25)",
    whiteGlass: "rgba(255,255,255,0.72)",
    amberBorder: "rgba(180, 83, 9, 0.15)",
    whiteRing: "rgba(255,255,255,0.35)",
  },
} as const;

/** Shorthand for the most-used brand color */
export const PRIMARY = colors.primary.DEFAULT;
