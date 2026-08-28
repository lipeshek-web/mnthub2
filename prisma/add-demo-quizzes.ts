/**
 * One-off: adiciona perguntas de quiz demo às aulas do curso "Arquitetura de
 * Software na Prática" (Carlos). Idempotente — pode rodar várias vezes.
 * Executar: bunx tsx prisma/add-demo-quizzes.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const QUIZ_BY_LESSON_TITLE: {
  match: string
  items: { prompt: string; options: string[]; correctIndex: number; explanation: string }[]
}[] = [
  {
    match: 'Camadas e fronteiras',
    items: [
      {
        prompt: 'Qual é o objetivo principal de separar um app em camadas?',
        options: [
          'Deixar o código com mais arquivos',
          'Isolar responsabilidades e reduzir o impacto de mudanças',
          'Acelerar o build do frontend',
          'Facilitar a contratação de devs',
        ],
        correctIndex: 1,
        explanation:
          'Camadas isolam responsabilidades: quando uma regra muda, a mudança fica contida na camada certa — sem vazar para UI e infraestrutura.',
      },
      {
        prompt: 'Numa arquitetura em camadas, a regra de negócio pura deve depender de…',
        options: [
          'do framework de UI (React)',
          'do banco de dados (SQL)',
          'de nada externo — só de suas próprias interfaces',
          'da API de pagamento',
        ],
        correctIndex: 2,
        explanation:
          'Domínio puro não conhece frameworks, banco nem APIs externas. As dependências apontam PARA dentro (dependência de abstrações).',
      },
    ],
  },
  {
    match: 'Modelagem de domínio',
    items: [
      {
        prompt: 'O que é um "invariante" na modelagem de domínio?',
        options: [
          'Uma configuração que nunca muda no deploy',
          'Uma regra que deve ser sempre verdadeira para o estado ser válido',
          'Uma variável de ambiente',
          'Um tipo de teste automatizado',
        ],
        correctIndex: 1,
        explanation:
          'Invariantes são regras que o domínio garante em toda operação (ex.: "toda sessão tem preço >= 0"). Elas definem o que é um estado válido.',
      },
      {
        prompt: 'Um caso de uso (application service) normalmente…',
        options: [
          'renderiza componentes de UI',
          'orquestra domínio e infraestrutura para completar uma ação do usuário',
          'define o schema do banco',
          'substitui os testes unitários',
        ],
        correctIndex: 1,
        explanation:
          'O caso de uso coordena a operação: valida entrada, aciona o domínio e usa a infraestrutura (repositórios, serviços) — sem lógica de negócio própria.',
      },
    ],
  },
  {
    match: 'Cache e performance',
    items: [
      {
        prompt: 'Qual é a estratégia de cache mais "barata" e que deve vir primeiro?',
        options: [
          'Redis cluster',
          'Memoização de cálculos no cliente',
          'CDN para arquivos estáticos',
          'Réplica de banco de dados',
        ],
        correctIndex: 2,
        explanation:
          'Para assets estáticos, a CDN/HTTP cache é a camada mais barata: evita a requisição inteira. Memoização ajuda em cálculos repetidos no cliente.',
      },
    ],
  },
  {
    match: 'Bem-vindo',
    items: [
      {
        prompt: 'Como aproveitar melhor este curso?',
        options: [
          'Assistir tudo em 2x sem praticar',
          'Aplicar o checklist de cada aula num projeto real seu',
          'Pular direto para o encerramento',
          'Fazer só as aulas em vídeo',
        ],
        correctIndex: 1,
        explanation:
          'Arquitetura se aprende aplicando: use o checklist de cada aula para revisar um projeto seu — e traga dúvidas para a office hour ao vivo.',
      },
    ],
  },
]

async function main() {
  const carlos = await db.user.findUnique({ where: { email: 'carlos@demo.com' } })
  if (!carlos) throw new Error('carlos@demo.com não encontrado — rode o seed principal')
  const profile = await db.mentorProfile.findUnique({ where: { userId: carlos.id } })
  if (!profile) throw new Error('Perfil de mentor do Carlos não encontrado')

  const lessons = await db.lesson.findMany({
    where: { course: { mentorId: profile.id } },
    orderBy: { order: 'asc' },
  })

  let created = 0
  for (const lesson of lessons) {
    const spec = QUIZ_BY_LESSON_TITLE.find((q) => lesson.title.toLowerCase().includes(q.match.toLowerCase()))
    if (!spec) continue
    for (const item of spec.items) {
      const exists = await db.quiz.findFirst({ where: { lessonId: lesson.id, prompt: item.prompt } })
      if (exists) continue
      await db.quiz.create({
        data: {
          lessonId: lesson.id,
          prompt: item.prompt,
          options: JSON.stringify(item.options),
          correctIndex: item.correctIndex,
          explanation: item.explanation,
        },
      })
      created++
      console.log(`+ quiz em "${lesson.title}": ${item.prompt.slice(0, 52)}…`)
    }
  }
  console.log(`\n${created} perguntas de quiz criadas.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
