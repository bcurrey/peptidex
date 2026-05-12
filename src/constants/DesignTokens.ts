export const Colors = {
  bgBase: "#0A0A0A",
  bgElevated: "#141414",
  bgCard: "#1A1A1A",
  bgCardRaised: "#222222",
  bgInteractive: "#2A2A2A",
  surfaceGreenDim: "#1A2B1E",
  surfaceRedDim: "#2B1A1A",
  accentGreen: "#3ECF6E",
  accentGreenDim: "rgba(62,207,110,0.15)",
  accentRed: "#E05C5C",
  accentRedDim: "rgba(224,92,92,0.15)",
  accentAmber: "#F59E0B",
  accentAmberDim: "rgba(245,158,11,0.15)",
  textPrimary: "#FFFFFF",
  textSecondary: "#A3A3A3",
  textTertiary: "#525252",
  textQuaternary: "#3A3A3A",
  borderSubtle: "rgba(255,255,255,0.06)",
  borderMedium: "rgba(255,255,255,0.10)",
} as const;

export const Spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
  s10: 40,
  s12: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const Typography = {
  hero: { fontSize: 48, fontWeight: "700", letterSpacing: -0.5 },
  titleLg: { fontSize: 28, fontWeight: "700", letterSpacing: -0.3 },
  titleMd: { fontSize: 22, fontWeight: "700" },
  titleSm: { fontSize: 17, fontWeight: "600" },
  body: { fontSize: 15, fontWeight: "400" },
  bodyMed: { fontSize: 15, fontWeight: "500" },
  label: { fontSize: 13, fontWeight: "400" },
  section: { fontSize: 11, fontWeight: "500", letterSpacing: 0.5, textTransform: "uppercase" },
  micro: { fontSize: 11, fontWeight: "400" },
} as const;
