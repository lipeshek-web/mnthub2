/**
 * Tema visual do app MentorHub — singleton mutável com dois modos.
 *
 * - `palettes` guarda as duas paletas completas (dark e light) com as MESMAS
 *   chaves; `theme` é o objeto em uso e é MUTADO por `applyMode` (mesma
 *   referência de objeto, propriedade a propriedade) para que todos os módulos
 *   que importam `theme` leiam a paleta ativa sem reimport.
 * - Dark: fundo "stone" bem escuro, cards stone-900 e destaque esmeralda #10b981
 *   (identidade original, preservada exatamente).
 * - Light: fundo stone-100, superfícies brancas e destaque esmeralda-700.
 * - A troca em runtime fica no ThemeProvider (src/lib/theme.tsx), que também
 *   persiste o modo; as telas recalculem os estilos ao remontar (App.js usa
 *   key={mode}).
 */

/* ------------------------------------------------------------------ */
/* Paletas                                                             */
/* ------------------------------------------------------------------ */

export interface ThemeColors {
  /** Fundo geral das telas. */
  bg: string;
  /** Cards. */
  surface: string;
  /** Inputs / superfícies elevadas / placeholders de imagem. */
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  /** Cor de destaque (esmeralda). */
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentBorder: string;
  /** Texto/ícone sobre o accent (botões cheios, toast de XP). */
  onAccent: string;
  danger: string;
  dangerText: string;
  dangerSoft: string;
  dangerBorder: string;
  warning: string;
  warningSoft: string;
  warningBorder: string;
  info: string;
  infoSoft: string;
  infoBorder: string;
  overlay: string;
  white: string;
}

export type ThemeMode = "dark" | "light";

export const palettes: Record<ThemeMode, ThemeColors> = {
  /* Dark — identidade original do app (stone-950 + esmeralda-500). */
  dark: {
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
    onAccent: "#0c0a09", // texto escuro sobre o verde claro
    danger: "#f87171", // red-400
    dangerText: "#fecaca", // red-200 (texto sobre fundo dangerSoft)
    dangerSoft: "rgba(248, 113, 113, 0.12)",
    dangerBorder: "rgba(248, 113, 113, 0.35)",
    warning: "#fbbf24", // amber-400 (estrelas, ofensiva, pendente)
    warningSoft: "rgba(251, 191, 36, 0.12)",
    warningBorder: "rgba(251, 191, 36, 0.35)",
    info: "#7dd3fc", // sky-300
    infoSoft: "rgba(125, 211, 252, 0.12)",
    infoBorder: "rgba(125, 211, 252, 0.3)",
    overlay: "rgba(0, 0, 0, 0.68)",
    white: "#ffffff",
  },

  /* Light — stone claro com esmeralda-700 (contraste AA em fundo claro). */
  light: {
    bg: "#f5f5f4", // fundo geral (stone-100)
    surface: "#ffffff", // cards
    surfaceAlt: "#fafaf9", // inputs / superfícies elevadas (stone-50)
    border: "#e7e5e5", // stone-200
    borderStrong: "#d6d3d1", // stone-300
    text: "#1c1917", // stone-900
    textMuted: "#57534e", // stone-600
    textFaint: "#a8a29e", // stone-400
    accent: "#047857", // esmeralda-700 (cor de destaque)
    accentStrong: "#065f46", // esmeralda-800
    accentSoft: "rgba(4, 120, 87, 0.10)",
    accentBorder: "rgba(4, 120, 87, 0.35)",
    onAccent: "#ffffff", // texto claro sobre o verde escuro
    danger: "#dc2626", // red-600
    dangerText: "#b91c1c", // red-700 (texto sobre fundo dangerSoft)
    dangerSoft: "rgba(220, 38, 38, 0.10)",
    dangerBorder: "rgba(220, 38, 38, 0.30)",
    warning: "#d97706", // amber-600
    warningSoft: "rgba(217, 119, 6, 0.12)",
    warningBorder: "rgba(217, 119, 6, 0.35)",
    info: "#0369a1", // sky-700
    infoSoft: "rgba(3, 105, 161, 0.10)",
    infoBorder: "rgba(3, 105, 161, 0.30)",
    overlay: "rgba(0, 0, 0, 0.45)",
    white: "#ffffff",
  },
};

/* ------------------------------------------------------------------ */
/* Singleton mutável                                                   */
/* ------------------------------------------------------------------ */

export const theme = {
  /** true = modo escuro ativo. */
  dark: true,
  colors: { ...palettes.dark },
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
};

/**
 * Aplica o modo no singleton MUTANDO theme.colors propriedade a propriedade
 * (mesma referência de objeto) e atualizando theme.dark.
 */
export function applyMode(mode: ThemeMode): void {
  const palette = palettes[mode] ?? palettes.dark;
  (Object.keys(palette) as Array<keyof ThemeColors>).forEach((key) => {
    theme.colors[key] = palette[key];
  });
  theme.dark = mode === "dark";
}

/** Modo atualmente aplicado no singleton. */
export function currentMode(): ThemeMode {
  return theme.dark ? "dark" : "light";
}

export type AppTheme = typeof theme;
