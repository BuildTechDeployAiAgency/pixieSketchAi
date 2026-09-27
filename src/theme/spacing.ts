/**
 * Spacing & sizing tokens.
 *
 * All dimensions in density-independent pixels.
 */

export const spacing = {
  /** Horizontal padding for screen content */
  screenPadding: 20,

  /** Standard gaps */
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  full: 999,
} as const;

export const sizing = {
  /** Icon wrapper sizes */
  iconSm: 24,
  iconMd: 36,
  iconLg: 46,
  iconXl: 68,

  /** Character card image */
  characterImage: 100,

  /** Image preview height */
  previewHeight: 240,

  /** Button minimum heights */
  buttonSm: 36,
  buttonMd: 48,
  buttonLg: 58,

  /** Segmented control */
  segmentHeight: 72,
  segmentHeightCompact: 58,

  /** Tier card min height */
  tierCard: 84,

  /** Pick card min height */
  pickCard: 164,
  pickCardCompact: 152,
} as const;
