// Seed do ARTIGO DEMO completo (demonstração do editor rico em blocos).
// Uso:
//   bun scripts/tmp/seed-demo-article.mts          → grava no SQLite local
//   bun --env-file=.zscripts/cloud.env bun scripts/tmp/seed-demo-article.mts → grava no Turso (produção)
// Idempotente: atualiza o item se o título já existir.
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

function makeDb() {
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL
  if (url) {
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || undefined
    type ClientOptions = ConstructorParameters<typeof PrismaClient>[0]
    const adapter = new PrismaLibSQL({ url, authToken })
    console.log('🌐 MODO NUVEM — gravando no Turso/libSQL remoto')
    return new PrismaClient({ adapter, log: ['error'] } as unknown as ClientOptions)
  }
  console.log('💾 MODO LOCAL — gravando no SQLite (db/custom.db)')
  return new PrismaClient({ log: ['error'] })
}

const db = makeDb()

const TITLE = 'O guia do criador: como nasce um artigo top na Órbita'

let idSeq = 0
const b = (t: string, extra: Record<string, unknown> = {}) => {
  idSeq += 1
  return { id: `demo${idSeq}`, t, ...extra }
}

const doc = {
  v: 1,
  blocks: [
    b('p', {
      x: 'Escrever bem é <b>ensinar de verdade</b>. Este artigo é um guia e, ao mesmo tempo, uma demonstração ao vivo: cada recurso do <a href="https://mentorhub.space-z.ai">editor de blocos da Órbita</a> aparece aqui exatamente como o aluno vai vê-lo — do <b>negrito</b> ao player de áudio.',
    }),
    b('callout', {
      tone: 'tip',
      x: 'Dica de ouro: formate com propósito. <b>Negrito</b> aponta o essencial, <i>itálico</i> dá tom, <u>sublinhado</u> marca termos-chave e um <a href="https://mentorhub.space-z.ai">link bem colocado</a> amplia a conversa. O exagero é inimigo da clareza.',
    }),
    b('h2', { x: 'Texto que respira' }),
    b('p', {
      x: 'Parágrafos curtos vencem sempre. Eles criam ritmo, sustentam a atenção e dão espaço para o que importa. Formatação diferente cria hierarquia — o olho do leitor sabe exatamente onde pousar, e a leitura flui sem esforço.',
    }),
    b('p', {
      x: 'Cada tamanho tem função: <b>Título grande</b> abre capítulos, <b>Seção</b> organiza o caminho, <b>Subseção</b> detalha o passo a passo. E dentro do texto você mistura tudo: <i>nuance em itálico</i>, <u>destaque em sublinhado</u>, <s>uma ideia corrigida em riscado</s> e links para aprofundar. Não é enfeite — é sinalização.',
    }),
    b('h2', { x: 'Imagens no meio do caminho' }),
    b('p', {
      x: 'Uma imagem quebrando o texto a cada poucos parágrafos segura a atenção e explica o que palavras demoram para dizer. No editor, ela entra com um clique — upload direto ou colando o endereço — e ainda recebe legenda:',
    }),
    b('img', {
      src: '/uploads/seed/artigo-editor-blocos.png',
      alt: 'Ilustração isométrica com blocos de conteúdo: texto, imagem, áudio, vídeo e botão',
      cap: 'Cada bloco tem sua função: texto, mídia, destaque e ação.',
    }),
    b('h2', { x: 'Áudio e vídeo: conteúdo para todo humor' }),
    b('p', {
      x: 'Tem gente que aprende lendo, outra ouvindo no ônibus e outra assistindo com um café na mão. O artigo top serve as três — é por isso que todo curso merece sua parte em áudio e vídeo embutido no fluxo da leitura.',
    }),
    b('aud', {
      src: '/uploads/seed/artigo-editor-voz.mp3',
      title: 'Versão em áudio · introdução do guia',
    }),
    b('p', {
      x: 'Continue tocando o artigo enquanto faz outra coisa — quem gosta de ouvir agradece. E quando o assunto pede movimento, o vídeo entra direto no meio do texto:',
    }),
    b('vid', {
      src: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      cap: 'Player demonstrativo — vídeos do YouTube, Vimeo ou MP4 abrem aqui dentro.',
    }),
    b('quote', {
      x: 'Conteúdo não é enfeite: é aula, é conversa, é a ponte entre a dúvida e o domínio.',
      by: 'Carlos Ferreira · Mentor na Órbita',
    }),
    b('h2', { x: 'Estrutura que ensina' }),
    b('p', { x: 'Por onde começar o seu primeiro artigo? Siga a receita que funciona:' }),
    b('ol', {
      items: [
        'Escolha <b>uma</b> dor específica do seu aluno — e prometa resolvê-la no título.',
        'Abra com uma história ou dado que comprove que você esteve lá.',
        'Quebre o caminho em seções curtas, com imagens, áudio ou vídeo entre elas.',
        'Feche com uma ação clara: um botão que leva ao próximo passo.',
      ],
    }),
    b('h3', { x: 'O checklist do artigo redondo' }),
    b('ul', {
      items: [
        'Título que promete exatamente o que o texto entrega',
        'Parágrafos de 2 a 4 linhas, sem paredões de texto',
        'Uma mídia a cada poucos blocos (imagem, áudio ou vídeo)',
        '<b>Um</b> chamado para ação no final — não cinco',
      ],
    }),
    b('callout', {
      tone: 'warn',
      x: 'Atenção: link de verdade, promessa de verdade. Todo botão deve levar para onde o texto promete — nada de CTA que leva a lugar nenhum.',
    }),
    b('hr'),
    b('h2', { x: 'Sua vez de publicar' }),
    b('p', {
      x: 'O editor está esperando na sua Biblioteca: <b>Para mentores → Biblioteca → Novo item → Artigo</b>. Escreva, formate, insira mídia e publique — o Explorar leva seu conteúdo para toda a comunidade, e suas aulas podem usá-lo como material de leitura.',
    }),
    b('p', {
      x: 'Comece hoje: o primeiro artigo sai imperfeito, o segundo sai bom, o terceiro já vira referência. <i>Consistência vence perfeição.</i>',
    }),
    b('btn', {
      label: 'Criar meu primeiro artigo',
      href: '/',
      variant: 'solid',
    }),
    b('btn', {
      label: 'Explorar a Biblioteca',
      href: '/',
      variant: 'outline',
    }),
  ],
}

async function main() {
  const mentor = await db.mentorProfile.findFirst({
    where: { user: { name: { contains: 'Carlos' } } },
    include: { user: { select: { name: true } } },
  })
  const fallback = mentor ? null : await db.mentorProfile.findFirst({ include: { user: { select: { name: true } } } })
  const owner = mentor ?? fallback
  if (!owner) throw new Error('Nenhum perfil de mentor encontrado — rode o seed principal antes.')

  const existing = await db.libraryItem.findFirst({ where: { title: TITLE, kind: 'ARTICLE' } })
  const data = {
    mentorId: owner.id,
    kind: 'ARTICLE',
    title: TITLE,
    description:
      'Um artigo vivo que demonstra o novo editor de blocos: formatação rica, imagens no meio do texto, áudio, vídeo, citações, destaques e botões — tudo no lugar certo.',
    category: 'Marketing',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/artigo-editor-cover.png',
    content: JSON.stringify(doc),
    readingMin: 7,
    isPublished: true,
  }

  if (existing) {
    await db.libraryItem.update({ where: { id: existing.id }, data })
    console.log(`♻️  Artigo demo atualizado (${existing.id}) — autor: ${owner.user.name}`)
  } else {
    const created = await db.libraryItem.create({ data })
    console.log(`✅ Artigo demo criado (${created.id}) — autor: ${owner.user.name}`)
  }
}

await main()
  .catch((err) => {
    console.error('❌ Falha no seed do artigo demo:', err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
