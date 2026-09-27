import type { TextStyle } from "react-native";
import { colors } from "./colors";

type TypographyDef = Pick<
  TextStyle,
  "fontSize" | "fontWeight" | "letterSpacing" | "lineHeight" | "color"
>;

export const typography: Record<string, TypographyDef> = {
  /** Screen titles */
  h1: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.gray[900],
    letterSpacing: -0.5,
  },

  /** Section headers (modal titles) */
  h2: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.gray[900],
    letterSpacing: -0.3,
  },

  /** Sub-section headers */
  h3: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.gray[900],
  },

  /** Card titles, button labels */
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.gray[900],
  },

  /** Style labels, tier titles */
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gray[900],
  },

  /** Body / input text */
  body: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.gray[800],
  },

  /** Subtitles, descriptions */
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.gray[400],
  },

  /** Captions, helper text */
  caption: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.gray[500],
  },

  /** Tiny labels (pills, badges) */
  tiny: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray[400],
  },

  /** Pill / badge uppercase text */
  pillLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  /** CTA button text */
  cta: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.3,
  },

  /** Credit badge number */
  creditCount: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.gray[800],
  },

  /** Price text */
  price: {
    fontSize: 20,
    fontWeight: "800",
  },
} as const;
