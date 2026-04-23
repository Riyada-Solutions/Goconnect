export const Colors = {
  primary: "#2DAAAE",
  primaryDark: "#0B7B8B",
  primaryLight: "#4DC4D6",
  secondary: "#1A2B4A",
  accent: "#00C9B1",
  accentLight: "#E3F7FA",

  light: {
    background: "#F5F6FA",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    card: "#FFFFFF",
    text: "#1A1A2E",
    textSecondary: "#8E9BB0",
    textTertiary: "#B8C4D0",
    border: "#EAEDF2",
    borderLight: "#F2F4F8",
    tint: "#2DAAAE",
    tabIconDefault: "#B8C4D0",
    tabIconSelected: "#2DAAAE",
    statusBar: "dark" as const,
    shadow: "rgba(26,26,46,0.08)",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },

  dark: {
    background: "#0A0F1A",
    surface: "#111827",
    surfaceElevated: "#1C2435",
    card: "#161E2E",
    text: "#F0F4F8",
    textSecondary: "#8A9BB0",
    textTertiary: "#4A5568",
    border: "#1E2D3D",
    borderLight: "#162230",
    tint: "#2DAAAE",
    tabIconDefault: "#4A5568",
    tabIconSelected: "#2DAAAE",
    statusBar: "light" as const,
    shadow: "rgba(0,0,0,0.3)",
    success: "#4ADE80",
    warning: "#FBBF24",
    error: "#F87171",
    info: "#60A5FA",
  },

  // Pastel icon backgrounds (HR-Mobile style)
  pastel: {
    teal: "#E3F7FA",
    green: "#E8F6F0",
    orange: "#FEF3E7",
    purple: "#EEF0FB",
    red: "#FDECEA",
    blue: "#EEF4FF",
    yellow: "#FEF9E7",
    pink: "#FDE8F0",
  },

  // Icon colors
  icon: {
    teal: "#2DAAAE",
    green: "#22C55E",
    orange: "#F59E0B",
    purple: "#8B5CF6",
    red: "#EF4444",
    blue: "#3B82F6",
  },
} as const;

export default Colors;
