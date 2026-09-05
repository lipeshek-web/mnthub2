/**
 * Contexto das abas principais (Início · Livros · Cursos · Mentorias · Mensagens).
 *
 * O Perfil NÃO é aba: fica acessível pelo ícone da conta no header da Home
 * (abre como tela do stack). As abas são páginas de um pager horizontal
 * (ScrollView pagingEnabled) controlado pelo MainTabs no App.js, sob um DOCK
 * flutuante (pill destacada, sem colar no rodapé). Qualquer tela — inclusive
 * as do stack, como Livro/Curso/Mentor — pode trocar de aba com
 * useTabs().setTab("Nome da aba"), sem depender de navigation.
 *
 * O Provider é montado no App.js (Root), ACIMA do NavigationContainer, para
 * que tanto as páginas do pager quanto as telas do stack acessem o mesmo
 * estado. Trocar de aba de dentro de uma tela do stack deve ser seguido de
 * navigation.goBack() para desempilhar e revelar o pager na aba nova.
 */
import { createContext, useContext } from "react";

/** Abas válidas, na ordem de exibição do pager (a conversa 1:1 é tela do stack). */
export const TAB_NAMES = ["Início", "Livros", "Cursos", "Mentorias", "Mensagens"] as const;

/** Folga vertical para o conteúdo das abas não ficar sob o dock flutuante. */
export const DOCK_CLEARANCE = 108;

export type TabName = (typeof TAB_NAMES)[number];

/** Verifica se o valor informado é uma aba válida. */
export function isTabName(value: unknown): value is TabName {
  return typeof value === "string" && (TAB_NAMES as readonly string[]).includes(value);
}

interface TabsContextValue {
  /** Nome da aba ativa. */
  tab: string;
  /** Troca a aba ativa (o pager rola até a página correspondente). */
  setTab: (t: string) => void;
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
