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
  cmtm035hr00dlmdarpan6799o: { totalPages: 5 }, // Clean Code na Prática — apostila
  cmtm035zy00dnmdard2df5k1z: { totalPages: 5 }, // Marketing Digital para Pequenos Negócios
  cmtm0366500dpmdarlz7l2gn3: { totalPages: 5 }, // Primeiros Passos na Bolsa de Valores
  cmtm036c900drmdar3fvf9wz6: { totalPages: 5 }, // Receitas que Vendem: bolos e brigadeiros
  cmtm036il00dtmdarmgq6pesk: { totalPages: 5 }, // Guia de Fotografia de Produto
  cmtm036ol00dvmdarvtjik0bv: { totalPages: 5 }, // Rotina de Alta Performance
  cmtm036up00dxmdar29zcsdpj: { totalPages: 5 }, // Métodos de Estudo Científicos
  'cmtnqyjib00dlpj4548s0csvs': { totalPages: 5 }, // Clean Code na Prática — apostila
  'cmtnqyk3100dnpj45tuhcq1o7': { totalPages: 5 }, // Marketing Digital para Pequenos Negócios
  'cmtnqyke600dppj4585m4qwlv': { totalPages: 5 }, // Primeiros Passos na Bolsa de Valores
  'cmtnqykoe00drpj45jbmz5bh5': { totalPages: 5 }, // Receitas que Vendem: bolos e brigadeiros
  'cmtnqykyf00dtpj45xyh63kaz': { totalPages: 5 }, // Guia de Fotografia de Produto
  'cmtnqyl7z00dvpj45sutkr000': { totalPages: 5 }, // Rotina de Alta Performance
  'cmtnqylic00dxpj45sowc5k59': { totalPages: 5 }, // Métodos de Estudo Científicos
  'cmto12u14005zpj46mluh4clw': { totalPages: 7 }, // Guia Prático do TCC
}
