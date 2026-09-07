/**
 * Tema visual do app Órbita — singleton mutável com dois modos.
 *
 * - `palettes` guarda as duas paletas completas (dark e light) com as MESMAS
 *   chaves; `theme` é o objeto em uso e é MUTADO por `applyMode` (mesma
 *   referência de objeto, propriedade a propriedade) para que todos os módulos
 *   que importam `theme` leiam a paleta ativa sem reimport.
 * - Identidade ÓRBITA: azul (mesma família da plataforma web — blue-600
 *   claro / blue-400 escuro) com neutros slate frios. Nada de âmbar/verde.
 * - Light: fundo off-white azulado (#f6f8fb), superfícies brancas, destaque
 *   blue-600. Dark: fundo noite azulada (#0b1220), cards azul-grafite,
 *   destaque blue-400 (contraste AA).
 * - A troca em runtime fica no ThemeProvider (src/lib/theme.tsx), que também
 *   persiste o modo; as telas recalculam os estilos ao remontar (App.js usa
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
  /* Dark — noite azulada Órbita: azul-grafite profundo + blue-400. */
  dark: {
    bg: "#0b1220", // fundo geral (noite azulada, quase slate-950)
    surface: "#111a2c", // cards
    surfaceAlt: "#1a2438", // inputs / superfícies elevadas
    border: "#1d2940",
    borderStrong: "#334155", // slate-700
    text: "#f1f5f9", // slate-100
    textMuted: "#94a3b8", // slate-400
    textFaint: "#64748b", // slate-500
    accent: "#5ba2f5", // azul Órbita claro (contraste AA no escuro)
    accentStrong: "#3b82f6", // blue-500
    accentSoft: "rgba(91, 162, 245, 0.15)",
    accentBorder: "rgba(91, 162, 245, 0.38)",
    onAccent: "#0b1220", // texto escuro sobre o azul claro
    danger: "#f87171", // red-400
    dangerText: "#fecaca", // red-200 (texto sobre fundo dangerSoft)
    dangerSoft: "rgba(248, 113, 113, 0.12)",
    dangerBorder: "rgba(248, 113, 113, 0.35)",
    warning: "#fbbf24", // âmbar SEMÂNTICO (estrelas, ofensiva, pendente)
    warningSoft: "rgba(251, 191, 36, 0.12)",
    warningBorder: "rgba(251, 191, 36, 0.35)",
    info: "#7dd3fc", // sky-300
    infoSoft: "rgba(125, 211, 252, 0.12)",
    infoBorder: "rgba(125, 211, 252, 0.3)",
    overlay: "rgba(2, 6, 23, 0.68)",
    white: "#ffffff",
  },

  /* Light — off-white azulado + blue-600 (mesma família da plataforma web). */
  light: {
    bg: "#f6f8fb", // fundo geral (off-white frio estilo Apple)
    surface: "#ffffff", // cards
    surfaceAlt: "#eef2f7", // inputs / superfícies elevadas
    border: "#e2e8f0", // slate-200
    borderStrong: "#cbd5e1", // slate-300
    text: "#0f172a", // slate-900
    textMuted: "#475569", // slate-600
    textFaint: "#94a3b8", // slate-400
    accent: "#2563eb", // blue-600 (cor de destaque)
    accentStrong: "#1d4ed8", // blue-700
    accentSoft: "rgba(37, 99, 235, 0.10)",
    accentBorder: "rgba(37, 99, 235, 0.32)",
    onAccent: "#ffffff", // texto claro sobre o azul
    danger: "#dc2626", // red-600
    dangerText: "#b91c1c", // red-700 (texto sobre fundo dangerSoft)
    dangerSoft: "rgba(220, 38, 38, 0.10)",
    dangerBorder: "rgba(220, 38, 38, 0.30)",
    warning: "#d97706", // âmbar SEMÂNTICO (estrelas, ofensiva, pendente)
    warningSoft: "rgba(217, 119, 6, 0.12)",
    warningBorder: "rgba(217, 119, 6, 0.35)",
    info: "#0369a1", // sky-700
    infoSoft: "rgba(3, 105, 161, 0.10)",
    infoBorder: "rgba(3, 105, 161, 0.30)",
    overlay: "rgba(15, 23, 42, 0.45)",
    white: "#ffffff",
  },
};

/* ------------------------------------------------------------------ */
/* Singleton mutável                                                   */
/* ------------------------------------------------------------------ */

export const theme = {
  /** true = modo escuro ativo. Órbita abre no CLARO (identidade azul/Apple). */
  dark: false,
  colors: { ...palettes.light },
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
    xl: 24,
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
