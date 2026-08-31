import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'
import { clientIp, rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** Limites anti-abuso e de contexto */
const MESSAGE_LIMIT = 1000 // caracteres por pergunta
const HISTORY_LIMIT = 10 // trocas anteriores enviadas ao modelo
const OUTLINE_LIMIT = 5000 // caracteres do sumário do curso
const LESSON_CONTENT_LIMIT = 6000 // caracteres do material da aula atual
const HISTORY_CONTENT_LIMIT = 2000 // caracteres por mensagem do histórico

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function sanitizeHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === 'object' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    )
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, HISTORY_CONTENT_LIMIT) }))
    .slice(-HISTORY_LIMIT)
}

/**
 * POST /api/ai/tutor — Tutor IA do curso.
 * Responde dúvidas do aluno com base no conteúdo do curso (sumário + aula atual).
 * Acesso: aluno matriculado ou dono do curso.
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 20 mensagens/min por IP (cada resposta custa LLM)
    const gate = rateLimit(`ai-tutor:${clientIp(req)}`, 20, 60_000)
    if (!gate.ok) return tooMany(gate.retryAfterSec)

    const body = await req.json().catch(() => ({}))
    const userId = String(body?.userId ?? '').trim()
    const courseId = String(body?.courseId ?? '').trim()
    const lessonId = String(body?.lessonId ?? '').trim()
    const message = String(body?.message ?? '').trim().slice(0, MESSAGE_LIMIT)
    const history = sanitizeHistory(body?.history)

    if (!userId) {
      return NextResponse.json(
        { error: 'Entre com sua conta para conversar com o Tutor IA.' },
        { status: 401 }
      )
    }
    if (!courseId) return NextResponse.json({ error: 'Curso não informado.' }, { status: 400 })
    if (!message) {
      return NextResponse.json({ error: 'Escreva sua dúvida antes de enviar.' }, { status: 400 })
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        title: true,
        description: true,
        category: true,
        level: true,
        mentor: { select: { userId: true, user: { select: { name: true } } } },
      },
    })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })

    // Acesso: dono do curso OU aluno matriculado
    const isOwner = course.mentor.userId === userId
    if (!isOwner) {
      const enrollment = await db.enrollment.findUnique({
        where: { courseId_studentId: { courseId, studentId: userId } },
        select: { id: true },
      })
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Somente alunos matriculados podem usar o Tutor IA deste curso.' },
          { status: 403 }
        )
      }
    }

    // Sumário do curso (temas → aulas) para ancorar as respostas
    const lessons = await db.lesson.findMany({
      where: { courseId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        libraryItem: { select: { title: true, description: true } },
        theme: { select: { title: true } },
      },
    })

    let outlineBudget = OUTLINE_LIMIT
    const outlineLines: string[] = []
    for (const l of lessons) {
      const themeTag = l.theme?.title ? `[${l.theme.title}] ` : ''
      const desc = l.description || l.libraryItem?.description || ''
      const line = `- ${themeTag}${l.title}${desc ? ` — ${desc}` : ''}`
      if (line.length > outlineBudget) break
      outlineBudget -= line.length
      outlineLines.push(line)
    }

    // Material da aula atual (quando informada)
    let lessonContext = ''
    if (lessonId) {
      const current = lessons.find((l) => l.id === lessonId)
      if (current) {
        const material = (current.content || '').slice(0, LESSON_CONTENT_LIMIT).trim()
        const reading = current.libraryItem
          ? ` (leitura: "${current.libraryItem.title}"${current.libraryItem.description ? ` — ${current.libraryItem.description}` : ''})`
          : ''
        lessonContext = [
          `Aula atual do aluno: "${current.title}"${reading}`,
          material ? `Material desta aula:\n${material}` : 'Esta aula não tem texto além do título/descrição.',
        ].join('\n')
      }
    }

    const mentorName = course.mentor.user.name
    const systemPrompt = [
      `Você é o Tutor IA do MentorHub, assistente de estudos do curso "${course.title}", do mentor ${mentorName}.`,
      `Categoria: ${course.category} · Nível: ${course.level}. Público: alunos brasileiros.`,
      'Regras:',
      '1. Responda SEMPRE em português do Brasil, de forma clara, direta e encorajadora.',
      '2. Baseie-se APENAS no conteúdo do curso fornecido abaixo. Não invente tópicos, links ou conteúdos que não existem no material.',
      '3. Se a resposta não estiver no material, seja honesto: diga que o assunto não é coberto pelo curso e sugira revisar a aula relacionada ou perguntar diretamente ao mentor na aba Perguntas.',
      '4. Respostas curtas (até ~150 palavras). Escreva em TEXTO PURO — nunca use markdown (nada de **, *, ##, crase). Para listas, use linhas começando com "• ".',
      '5. Se o aluno pedir algo fora do tema do curso (ex.: outros assuntos), redirecione gentilmente para o conteúdo do curso.',
    ].join('\n')

    const userContext = [
      `Sumário do curso (${lessons.length} aulas):`,
      outlineLines.join('\n') || '(sem aulas publicadas)',
      lessonContext ? `\n${lessonContext}` : '',
      `\nDescrição do curso: ${course.description.slice(0, 800)}`,
    ].join('\n')

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'assistant', content: `Contexto do curso para suas respostas:\n${userContext}` },
        ...history,
        { role: 'user', content: message },
      ],
      thinking: { type: 'disabled' },
    })

    const reply = (completion.choices[0]?.message?.content ?? '').trim()
    if (!reply) {
      return NextResponse.json(
        { error: 'O Tutor IA não conseguiu responder agora. Tente novamente.' },
        { status: 502 }
      )
    }

    // Sanitiza markdown residual do modelo (o painel renderiza texto puro)
    const cleanReply = reply
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/`([^`\n]+)`/g, '$1')
      .trim()

    return NextResponse.json({ reply: cleanReply.slice(0, 4000) })
  } catch (err) {
    console.error('POST /api/ai/tutor', err)
    return NextResponse.json(
      { error: 'Erro ao consultar o Tutor IA. Tente novamente.' },
      { status: 500 }
    )
  }
}
