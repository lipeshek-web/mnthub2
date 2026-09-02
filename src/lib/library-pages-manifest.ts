/**
 * Manifesto das páginas pré-renderizadas dos livros da biblioteca (leitor
 * nativo do app mobile). Gerado a partir dos PDFs em public/uploads/seed/
 * (mesma rasterização embutida no app Snack — assets/pages).
 *
 * Cada livro publicado tem suas páginas servidas estaticamente em
 * /library-pages/<libraryItemId>/p<N>.png (arquivos em public/, vão para
 * produção a cada publish). A rota /api/v1/library/[id]/reader monta as URLs
 * absolutas a partir daqui.
 *
 * Para adicionar páginas de um livro novo: renderize os PNGs (pdftoppm ou
 * pdfjs) em public/library-pages/<id>/p1.png… e acrescente a entrada abaixo.
 */
export const LIBRARY_PAGES_MANIFEST: Record<string, { totalPages: number }> = {
  cmtfmogml0005ir8yi05xidka: { totalPages: 1 }, // Como Estudar com Pomodoro
  cmtfmogmj0003ir8yb87kr5ao: { totalPages: 1 }, // Gestão Financeira para Jovens
  cmtfmogmg0001ir8y63zf8gw7: { totalPages: 1 }, // Inovação
  cmtd0bemq007anl0685281t80: { totalPages: 6 }, // Fundamentos de Dados — apostila da trilha
  cmtd0bemo0076nl069u2qxudx: { totalPages: 7 }, // Arquitetura que Escala — capítulo de amostra
}
