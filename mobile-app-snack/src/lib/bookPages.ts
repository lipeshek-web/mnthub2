/**
 * Páginas PRÉ-RENDERIZADAS dos livros da biblioteca — embutidas no app como
 * data URI (base64) dentro do código.
 *
 * Por que data URI e não arquivos de asset? O runtime do Snack trava em
 * "Loading..." quando o projeto salvo contém arquivos ASSET (provado por
 * probes A/B em 2026-09-02: snack idêntico com assets = trava; sem assets =
 * roda). Embutindo os bytes no código, o preview web e o Expo Go funcionam
 * e o leitor segue 100% nativo (imagens página a página, sem WebView).
 *
 * O leitor de PDF do app é nativo (imagens página a página): os livros do
 * catálogo vêm com as páginas já convertidas em PNG aqui dentro, então abrir
 * um livro é instantâneo e funciona igual no web e no Expo Go — sem depender
 * de endpoint de rasterização.
 *
 * Livros sem entrada nesta tabela usam o leitor dinâmico (getLibraryReader) e,
 * se ele não responder, o fallback "abrir PDF original".
 *
 * Para regenerar: bun scripts/embed-pages.js (fonte: assets/pages/*.png).
 */
import type { LibraryReader } from "./api";
import { ArquiteturaPages } from "./bookPagesData/arquiteturaPages";
import { DadosPages } from "./bookPagesData/dadosPages";
import { GestaoPages } from "./bookPagesData/gestaoPages";
import { InovacaoPages } from "./bookPagesData/inovacaoPages";
import { PomodoroPages } from "./bookPagesData/pomodoroPages";

export interface StaticPage {
  /** Número da página (1-based). */
  n: number;
  /** Imagem da página: data URI base64 (nativo e web aceitam { uri }). */
  source: number | { uri: string };
}

export type StaticBook = Omit<LibraryReader, "pages"> & { pages: StaticPage[] };

function fromData(pages: string[]): StaticPage[] {
  return pages.map((uri, i) => ({ n: i + 1, source: { uri } }));
}

export const BOOK_PAGES: Record<string, StaticBook> = {
  "cmtfmogml0005ir8yi05xidka": {
    itemId: "cmtfmogml0005ir8yi05xidka",
    title: "Como Estudar com Pomodoro",
    totalPages: PomodoroPages.length,
    pages: fromData(PomodoroPages),
  },
  "cmtfmogmj0003ir8yb87kr5ao": {
    itemId: "cmtfmogmj0003ir8yb87kr5ao",
    title: "Gestão Financeira para Jovens",
    totalPages: GestaoPages.length,
    pages: fromData(GestaoPages),
  },
  "cmtfmogmg0001ir8y63zf8gw7": {
    itemId: "cmtfmogmg0001ir8y63zf8gw7",
    title: "Inovação",
    totalPages: InovacaoPages.length,
    pages: fromData(InovacaoPages),
  },
  "cmtd0bemq007anl0685281t80": {
    itemId: "cmtd0bemq007anl0685281t80",
    title: "Fundamentos de Dados — apostila da trilha",
    totalPages: DadosPages.length,
    pages: fromData(DadosPages),
  },
  "cmtd0bemo0076nl069u2qxudx": {
    itemId: "cmtd0bemo0076nl069u2qxudx",
    title: "Arquitetura que Escala — capítulo de amostra",
    totalPages: ArquiteturaPages.length,
    pages: fromData(ArquiteturaPages),
  },
};
