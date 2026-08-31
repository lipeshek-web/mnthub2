/**
 * Páginas PRÉ-RENDERIZADAS dos livros da biblioteca — assets embutidos no app.
 *
 * O leitor de PDF do app é nativo (imagens página a página, sem WebView e sem
 * render no servidor): os livros do catálogo vêm com as páginas já convertidas
 * em PNG aqui dentro, então abrir um livro é instantâneo e funciona igual no
 * web e no Expo Go — sem depender de endpoint de rasterização.
 *
 * Livros sem entrada nesta tabela usam o leitor dinâmico (getLibraryReader) e,
 * se ele não responder, o fallback "abrir PDF original".
 */
import type { LibraryReader } from "./api";

export interface StaticPage {
  /** Número da página (1-based). */
  n: number;
  /** Asset local: require() do PNG (número no nativo; { uri } no web). */
  source: number | { uri: string };
}

export type StaticBook = Omit<LibraryReader, "pages"> & { pages: StaticPage[] };

export const BOOK_PAGES: Record<string, StaticBook> = {
  "cmtfmogml0005ir8yi05xidka": {
    itemId: "cmtfmogml0005ir8yi05xidka",
    title: "Como Estudar com Pomodoro",
    totalPages: 1,
    pages: [
      { n: 1, source: require("../../assets/pages/pomodoro-p1.png") },
    ],
  },
  "cmtfmogmj0003ir8yb87kr5ao": {
    itemId: "cmtfmogmj0003ir8yb87kr5ao",
    title: "Gestão Financeira para Jovens",
    totalPages: 1,
    pages: [
      { n: 1, source: require("../../assets/pages/gestao-p1.png") },
    ],
  },
  "cmtfmogmg0001ir8y63zf8gw7": {
    itemId: "cmtfmogmg0001ir8y63zf8gw7",
    title: "Inovação",
    totalPages: 1,
    pages: [
      { n: 1, source: require("../../assets/pages/inovacao-p1.png") },
    ],
  },
  "cmtd0bemq007anl0685281t80": {
    itemId: "cmtd0bemq007anl0685281t80",
    title: "Fundamentos de Dados — apostila da trilha",
    totalPages: 6,
    pages: [
      { n: 1, source: require("../../assets/pages/dados-p1.png") },
      { n: 2, source: require("../../assets/pages/dados-p2.png") },
      { n: 3, source: require("../../assets/pages/dados-p3.png") },
      { n: 4, source: require("../../assets/pages/dados-p4.png") },
      { n: 5, source: require("../../assets/pages/dados-p5.png") },
      { n: 6, source: require("../../assets/pages/dados-p6.png") },
    ],
  },
  "cmtd0bemo0076nl069u2qxudx": {
    itemId: "cmtd0bemo0076nl069u2qxudx",
    title: "Arquitetura que Escala — capítulo de amostra",
    totalPages: 7,
    pages: [
      { n: 1, source: require("../../assets/pages/arquitetura-p1.png") },
      { n: 2, source: require("../../assets/pages/arquitetura-p2.png") },
      { n: 3, source: require("../../assets/pages/arquitetura-p3.png") },
      { n: 4, source: require("../../assets/pages/arquitetura-p4.png") },
      { n: 5, source: require("../../assets/pages/arquitetura-p5.png") },
      { n: 6, source: require("../../assets/pages/arquitetura-p6.png") },
      { n: 7, source: require("../../assets/pages/arquitetura-p7.png") },
    ],
  },
};
