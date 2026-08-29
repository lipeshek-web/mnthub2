// Gera PDFs de demonstração (livro/apostila) em public/uploads/seed/
// Uso: bun prisma/gen-seed-pdfs.ts
// Implementa um gerador mínimo de PDF 1.4 (Helvetica) sem dependências.
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'public', 'uploads', 'seed')
fs.mkdirSync(OUT, { recursive: true })

const A4 = [595, 842]
const MARGIN = 64
const LINE = 15.5

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

/** Quebra o texto em linhas que caibam na largura útil (aprox. por caracteres) */
function wrap(text: string, maxChars: number): string[] {
  const out: string[] = []
  for (const para of text.split(/\n/)) {
    if (!para.trim()) {
      out.push('')
      continue
    }
    if (para.startsWith('## ')) {
      out.push(`## ${para.slice(3)}`)
      continue
    }
    let line = ''
    for (const word of para.split(/\s+/)) {
      if ((line + ' ' + word).trim().length > maxChars) {
        out.push(line.trim())
        line = word
      } else {
        line = (line + ' ' + word).trim()
      }
    }
    if (line) out.push(line)
  }
  return out
}

type PageInput = { heading: string; body: string }

/** Monta um PDF A4 com capa + páginas de texto */
function makePdf(title: string, subtitle: string, author: string, pages: PageInput[]): Buffer {
  // ---------- conteúdo ----------
  const streams: string[] = []

  // Capa
  const cover: string[] = []
  cover.push('0.059 0.42 0.478 rg') // emerald ~#0F7A7A
  cover.push('0 792 595 50 re f')
  cover.push('0 0 595 12 re f')
  cover.push('BT')
  cover.push('/F2 26 Tf 1 1 1 rg')
  cover.push(`64 760 Td (${esc('MentorHub · Biblioteca')}) Tj`)
  cover.push('ET')
  cover.push('BT')
  cover.push('/F2 30 Tf 0.12 0.12 0.12 rg')
  cover.push(`64 560 Td 34 TL (${esc(title.length > 34 ? title.slice(0, 34) : title)}) Tj T*`)
  if (title.length > 34) cover.push(`(${esc(title.slice(34, 68))}) Tj T*`)
  cover.push('ET')
  cover.push('BT')
  cover.push('/F1 14 Tf 0.35 0.35 0.35 rg')
  cover.push(`64 500 Td (${esc(subtitle)}) Tj`)
  cover.push('ET')
  cover.push('BT')
  cover.push('/F1 12 Tf 0.4 0.4 0.4 rg')
  cover.push(`64 90 Td (${esc('por ' + author)}) Tj`)
  cover.push('ET')
  cover.push('BT')
  cover.push('/F1 10 Tf 0.55 0.55 0.55 rg')
  cover.push(`64 70 Td (${esc('Material de estudo da plataforma MentorHub — mentorhub.demo')}) Tj`)
  cover.push('ET')
  streams.push(cover.join('\n'))

  for (const page of pages) {
    const maxChars = 86
    const lines = wrap(page.body, maxChars)
    const cmds: string[] = []
    cmds.push('BT')
    cmds.push('/F2 18 Tf 0.059 0.35 0.31 rg') // emerald-800
    cmds.push(`64 780 Td (${esc(page.heading)}) Tj`)
    cmds.push('ET')
    cmds.push('0.898 0.898 0.898 RG 1 w 64 764 m 531 764 l S')
    cmds.push('BT')
    cmds.push('/F1 11 Tf 0.22 0.22 0.22 rg')
    cmds.push(`64 740 Td ${LINE} TL`)
    lines.forEach((ln, idx) => {
      if (idx === lines.length - 1) {
        if (ln) cmds.push(`(${esc(ln)}) Tj`)
      } else if (ln.startsWith('## ')) {
        cmds.push('0.059 0.35 0.31 rg')
        cmds.push(`(${esc(ln.slice(3))}) Tj T*`)
        cmds.push('0.22 0.22 0.22 rg')
      } else if (ln === '') {
        cmds.push('T*')
      } else {
        cmds.push(`(${esc(ln)}) Tj T*`)
      }
    })
    cmds.push('ET')
    // rodapé
    cmds.push('BT')
    cmds.push('/F1 9 Tf 0.55 0.55 0.55 rg')
    cmds.push(`64 40 Td (${esc(title + ' · ' + author)}) Tj`)
    cmds.push('ET')
    streams.push(cmds.join('\n'))
  }

  // ---------- objetos ----------
  const nPages = streams.length
  const objs: string[] = []
  const pageObjNums: number[] = []
  const contentObjNums: number[] = []
  // layout: 1 Catalog, 2 Pages, 3 F1, 4 F2, depois pares (page, content)
  let next = 5
  for (let i = 0; i < nPages; i++) {
    pageObjNums.push(next++)
    contentObjNums.push(next++)
  }

  objs[1] = `<< /Type /Catalog /Pages 2 0 R >>`
  objs[2] = `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${nPages} >>`
  objs[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`
  objs[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`

  for (let i = 0; i < nPages; i++) {
    objs[pageObjNums[i]] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4[0]} ${A4[1]}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNums[i]} 0 R >>`
    objs[contentObjNums[i]] = `<< /Length ${Buffer.byteLength(streams[i], 'latin1')} >>\nstream\n${streams[i]}\nendstream`
  }

  // ---------- serialização com xref ----------
  const chunks: Buffer[] = []
  let offset = 0
  const offsets: number[] = []
  const push = (s: string) => {
    const b = Buffer.from(s, 'latin1')
    chunks.push(b)
    offset += b.length
  }

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = offset
    push(`${i} 0 obj\n${objs[i]}\nendobj\n`)
  }
  const xrefStart = offset
  const total = objs.length // último número + 1
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`
  for (let i = 1; i < total; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  push(xref)
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`)

  return Buffer.concat(chunks)
}

// ---------- Livro: Arquitetura que Escala (Carlos) ----------
const livroArquitetura = makePdf(
  'Arquitetura que Escala',
  'Capítulo de amostra — Camadas, domínio e fronteiras que sobrevivem ao crescimento',
  'Carlos Ferreira',
  [
    {
      heading: '1. Por que arquitetura importa (mesmo no começo)',
      body: `Todo sistema nasce simples. Um par de pastas, um arquivo de rotas, um banco recém-criado. E é exatamente aí que a arquitetura decide o futuro do projeto — não quando ele "fica grande", mas muito antes.

Arquitetura não é sobre diagramas bonitos nem sobre escolher o framework da moda. É sobre **onde as decisões vivem** e **o quão caro é mudar de ideia**. Um sistema bem arquitetado é aquele em que trocar o banco, mudar uma regra de negócio ou redesenhar uma tela toca poucos arquivos — porque as fronteiras já existem.

## O custo invisível da mescla

Quando a UI fala direto com o banco, cada tela vira um ponto de decisão duplicado. Regras de desconto aparecem em três lugares. Formatação de moeda tem duas implementações. Nenhum desses problemas aparece no demo — aparecem no terceiro mês, quando o time dobra e o backlog não anda.

A conta é simples: arquitetura é o que faz o custo de UMA mudança ser O(1) em vez de O(N). E o N, em software, sempre cresce.`,
    },
    {
      heading: '2. As quatro camadas que sobrevivem ao tempo',
      body: `Depois de 12 anos refatorando sistemas alheios, cheguei a um conjunto mínimo de camadas que funciona para quase tudo:

## UI (interface)
Componentes, telas, estados visuais. A camada mais "burra" do sistema — e é elogio: ela só exibe e coleta. Nada de regra de negócio, nada de SQL.

## Aplicação (casos de uso)
Os verbos do sistema: InscreverAluno, PublicarCurso, CancelarAgendamento. Cada caso de uso valida entrada, aplica regras, executa efeitos e devolve um resultado claro. É a camada mais importante e a mais esquecida.

## Domínio
As regras que fazem o SEU negócio ser o seu negócio: como se calcula preço, quando um pedido pode ser cancelado, o que significa "matrícula ativa". Puro, testável, sem framework.

## Infraestrutura
HTTP, banco, filas, cache, e-mail. Detalhe plugável — nunca protagonista.`,
    },
    {
      heading: '3. A regra de ouro das dependências',
      body: `Se você levar uma única frase deste capítulo, que seja esta:

**Dependências apontam para dentro.**

UI conhece Aplicação. Aplicação conhece Domínio. Infraestrutura é plugada na Aplicação — nunca o contrário. O domínio não importa React, nem o SDK do banco, nem o cliente HTTP.

## Como testar se seu projeto respeita a regra

Abra a pasta do domínio e procure por imports de bibliotecas de UI ou de banco. Achou? Você não tem domínio — tem uma bagunça com nome bonito.

O teste prático: "consigo rodar minhas regras de negócio num script de terminal, sem navegador, sem servidor?" Se sim, suas fronteiras estão de pé.`,
    },
    {
      heading: '4. Casos de uso: os verbos do sistema',
      body: `Um caso de uso bem escrito é uma intenção com nome de negócio. Não "handler", não "controller" — **UseCase**.

## Anatomia mínima

1. **Entrada tipada**: o que o mundo exterior precisa fornecer (dados validados).
2. **Autorização**: quem pode fazer isso?
3. **Regras**: o que o negócio exige para permitir?
4. **Efeitos**: persistir, notificar, disparar eventos.
5. **Resultado**: sucesso com dados, ou erro de negócio nomeado.

## O erro mais comum

Colocar a regra no lugar errado. "Aluno não pode se inscrever em curso despublicado" é REGRA (domínio/aplicação), não um if na tela. Regra espalhada em if de UI é dívida garantida: ela vai ser esquecida na próxima tela que fizer a mesma operação.`,
    },
    {
      heading: '5. Refatoração incremental: o método das duas semanas',
      body: `Ninguém reescreve um sistema em um fim de semana — e quem tenta, geralmente entrega dois sistemas ruins. O método que uso com mentorados:

## Semana 1 — Mapear
Liste as 10 operações de negócio mais frequentes do sistema. Para cada uma, anote em quantos arquivos a regra aparece hoje. Esse número é seu baseline.

## Semana 2 — Centralizar
Escolha as 3 regras mais duplicadas e centralize cada uma em um módulo próprio (use case). Atualize os chamadores. Meça de novo.

A diferença entre os dois números é a sua primeira vitória mensurável de arquitetura — e o argumento técnico mais forte que você pode levar para a próxima discussão de prioridade com o time.`,
    },
    {
      heading: 'Onde continuar',
      body: `Este capítulo é uma amostra do curso **Arquitetura de Software na Prática**, onde refatoramos um sistema real aula por aula — com checklists, revisão de código e mentoria 1:1 incluída.

## Checklist final do capítulo

- Existe pasta/módulo de domínio sem imports de framework?
- Cada operação de negócio tem UM caso de uso com nome claro?
- A UI chama casos de uso — nunca banco/HTTP direto?
- Você consegue explicar as camadas em 30 segundos para um dev novo?

Se marcou quatro "sim", seu projeto está pronto para escalar. Se marcou menos de dois, comece pela regra de ouro das dependências — é a alavanca mais barata que existe.`,
    },
  ]
)

// ---------- Apostila: Fundamentos de Dados (Beatriz) ----------
const apostilaDados = makePdf(
  'Fundamentos de Dados',
  'Apostila da trilha — coleta, limpeza e leitura crítica de dados',
  'Beatriz Lima',
  [
    {
      heading: '1. Dado não é informação',
      body: `Um número solto não conta nada. "47% de churn" não conta nada — até você saber de QUE período, de QUAL segmento e em COMPARAÇÃO a quê.

O trabalho com dados começa exatamente aí: transformar número em contexto, contexto em informação, informação em decisão.

## As três perguntas de todo dado

1. **Origem**: quem mediu, como, com qual instrumento?
2. **Escopo**: qual população, qual janela de tempo?
3. **Comparação**: acima ou abaixo de quê?

Pule qualquer uma delas e você estará apresentando opinião com cara de estatística.`,
    },
    {
      heading: '2. Coleta: o lixo entra pela porta da frente',
      body: `80% do tempo de qualquer trabalho com dados vai em **limpeza** — e a maior parte da sujeira nasce na coleta.

## Regras de sobrevivência

- **Nomeie antes de coletar**: evento "signup_click" hoje e "cadastro_finalizado" amanhã quebra qualquer análise.
- **Versione o dicionário de dados**: cada campo tem dono, tipo e descrição.
- **Não corrija na mão**: correção manual não escala e não é auditável. Corrija na origem.

## O teste do repaint

Se você reprocessasse toda a coleta do zero, chegaria aos mesmos números? Se a resposta for "não sei", sua coleta não é confiável — e toda análise em cima dela é um castelo de areia.`,
    },
    {
      heading: '3. Limpeza: um checklist honesto',
      body: `## Antes de qualquer análise

- Duplicatas exatas e quase-exatas (mesmo usuário, e-mail com maiúscula/minúscula).
- Nulos: estão vazios porque não existe, porque não souberam ou porque deu erro?
- Outliers: primeiro investigue, depois decida. Excluir sem entender é censurar o dado.
- Tipos: data como texto é o clássico — e o mais caro de descobrir tarde.

## Documente o que você fez

Cada transformação vai no log da análise. A pergunta "como você chegou nesse número?" precisa de resposta em 30 segundos — não em uma tarde.`,
    },
    {
      heading: '4. Leitura crítica: os erros que mais enganam',
      body: `## Média sem distribuição
"Tempo médio de resposta: 3min" — com metade respondendo em 10s e metade em 6min? A média esconde dois produtos diferentes.

## Correlação vira causalidade
Vendas de sorvete e afogamentos sobem juntos. Não é o sorvete.

## Sobrevivência
Você ouve o sucesso dos que usaram a ferramenta — nunca dos que abandonaram. O chamado "viés do sobrevivente" é o mais comum em cases de marketing.

## P-hacking honesto
Se você testar 20 hipóteses, uma vai "dar significativa" por acaso. Corrija o p-valor ou declare todas as hipóteses ANTES de olhar os dados.`,
    },
    {
      heading: '5. Do número à decisão',
      body: `Uma análise só vale quando termina em uma decisão melhor. O formato que uso para comunicar:

## O parágrafo de decisão

1. **Pergunta**: o que estávamos tentando responder?
2. **Evidência**: o número, com escopo e comparação.
3. **Limitação**: o que este número NÃO responde.
4. **Recomendação**: o que fazer (e o que NÃO fazer ainda).

Quatro linhas. Se a sua análise precisa de vinte slides para explicar, provavelmente ela ainda não sabe qual é a pergunta.

## Próximos passos

Aplique o checklist da apostila no último relatório que você recebeu. Quantas das três perguntas (origem, escopo, comparação) ele responde? O gap é o seu plano de estudo — e o assunto da próxima mentoria.`,
    },
  ]
)

fs.writeFileSync(path.join(OUT, 'livro-arquitetura.pdf'), livroArquitetura)
fs.writeFileSync(path.join(OUT, 'apostila-dados.pdf'), apostilaDados)
console.log('✅ PDFs gerados em public/uploads/seed/: livro-arquitetura.pdf, apostila-dados.pdf')
