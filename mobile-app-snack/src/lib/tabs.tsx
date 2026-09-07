/**
 * Contexto das abas principais (Início · Explorar · Mensagens · Perfil).
 *
 * Navegação minimalista Órbita: 4 abas apenas. Cursos, Livros e Mentores
 * vivem DENTRO de Explorar (segmented control iOS) — não são mais abas nem
 * telas próprias. As abas são páginas de um pager horizontal (ScrollView
 * pagingEnabled) sob uma TAB BAR nativa estilo iOS (barra sólida com
 * hairline, no rodapé). Qualquer tela — inclusive as do stack, como
 * Livro/Curso/Mentor — pode trocar de aba com useTabs().setTab("Nome da
 * aba"), sem depender de navigation.
 *
 * O Provider é montado no App.js (Root), ACIMA do NavigationContainer, para
 * que tanto as páginas do pager quanto as telas do stack acessem o mesmo
 * estado. Trocar de aba de dentro de uma tela do stack deve ser seguido de
 * navigation.goBack() para desempilhar e revelar o pager na aba nova.
 */
import { createContext, useContext } from "react";

/** Abas válidas, na ordem de exibição do pager (a conversa 1:1 é tela do stack). */
export const TAB_NAMES = ["Início", "Explorar", "Mensagens", "Perfil"] as const;

/** Folga vertical para o conteúdo das abas não ficar sob a tab bar nativa. */
export const DOCK_CLEARANCE = 104;

export type TabName = (typeof TAB_NAMES)[number];

/** Segmentos da aba Explorar (controlados pelo segmented control iOS). */
export const SEGMENT_NAMES = ["Cursos", "Livros", "Mentorias"] as const;
export type SegmentName = (typeof SEGMENT_NAMES)[number];

/** Verifica se o valor informado é uma aba válida. */
export function isTabName(value: unknown): value is TabName {
  return typeof value === "string" && (TAB_NAMES as readonly string[]).includes(value);
}

/** Verifica se o valor informado é um segmento válido da Explorar. */
export function isSegmentName(value: unknown): value is SegmentName {
  return typeof value === "string" && (SEGMENT_NAMES as readonly string[]).includes(value);
}

interface TabsContextValue {
  /** Nome da aba ativa. */
  tab: string;
  /** Troca a aba ativa (o pager rola até a página correspondente). */
  setTab: (t: string) => void;
  /** Segmento ativo dentro de Explorar (Cursos · Livros · Mentores). */
  segment: SegmentName;
  /** Troca o segmento da Explorar (persiste no contexto para voltar onde estava). */
  setSegment: (s: SegmentName) => void;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

/** Acesso ao estado das abas — só funciona dentro do TabsContext.Provider. */
export function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error("useTabs precisa estar dentro do TabsContext.Provider (App.js).");
  }
  return ctx;
}
