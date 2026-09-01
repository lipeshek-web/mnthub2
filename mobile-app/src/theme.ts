/**
 * Tema visual do app MentorHub.
 * Dark suave: fundo "stone" bem escuro, cards stone-900 e destaque esmeralda #10b981.
 */
export const theme = {
  colors: {
    bg: "#0c0a09", // fundo geral (stone-950)
    surface: "#1c1917", // cards (stone-900)
    surfaceAlt: "#292524", // inputs / superfícies elevadas (stone-800)
    border: "#292524",
    borderStrong: "#44403c", // stone-700
    text: "#fafaf9", // stone-50
    textMuted: "#a8a29e", // stone-400
    textFaint: "#78716c", // stone-500
    accent: "#10b981", // esmeralda-500 (cor de destaque)
    accentStrong: "#059669",
    accentSoft: "rgba(16, 185, 129, 0.14)",
    accentBorder: "rgba(16, 185, 129, 0.4)",
    danger: "#f87171", // red-400
    dangerText: "#fecaca", // red-200 (texto sobre fundo dangerSoft)
    dangerSoft: "rgba(248, 113, 113, 0.12)",
    dangerBorder: "rgba(248, 113, 113, 0.35)",
    warning: "#fbbf24", // amber-400 (estrelas, ofensiva, pendente)
    warningSoft: "rgba(251, 191, 36, 0.12)",
    warningBorder: "rgba(251, 191, 36, 0.35)",
    info: "#7dd3fc", // sky-300
    infoSoft: "rgba(125, 211, 252, 0.12)",
    overlay: "rgba(0, 0, 0, 0.68)",
    white: "#ffffff",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 999,
  },
} as const;

export type AppTheme = typeof theme;
