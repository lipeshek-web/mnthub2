import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'
import { resolveUser, unauthorized } from '@/lib/session'
import { rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** Limites de contexto enviados ao modelo */
const CONTENT_LIMIT = 8000 // caracteres do material da aula
const KEY_POINT_LIMIT = 6

function extractJson(text: string): { summary?: unknown; keyPoints?: unknown } | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

function normalizeKeyPoints(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((p): p is string => typeof p === 'string')
    .map((p) => p.trim().slice(0, 160))
    .filter(Boolean)
    .slice(0, KEY_POINT_LIMIT)
}

/**
 * POST /api/lessons/[lessonId]/ai-summary
 * Gera (1x) e cacheia o resumo + tópicos-chave da aula.
 * Acesso: aluno matriculado ou dono do curso.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ lessonId: string }> }) {
  try {
    // Sessão em vez de userId do body + rate limit (chama LLM = custo real)
    const session = await resolveUser(req)
    if (!session) return unauthorized()
    const gate = rateLimit(`ai-summary:${session.id}`, 10, 60_000)
    if (!gate.ok) return tooMany(gate.retryAfterSec)

    const { lessonId } = await ctx.params
    const body = await req.json().catch(() => ({}))
    const userId = session.id

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        description: true,
        kind: true,
        content: true,
        courseId: true,
        libraryItem: { select: { title: true, description: true, content: true } },
        theme: { select: { title: true } },
        course: {
          select: {
            title: true,
            category: true,
            level: true,
            mentor: { select: { userId: true } },
          },
        },
      },
    })
    if (!lesson) return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })

    // Acesso: dono do curso OU aluno matriculado
    const isOwner = lesson.course.mentor.userId === userId
    if (!isOwner) {
      const enrollment = await db.enrollment.findUnique({
        where: { courseId_studentId: { courseId: lesson.courseId, studentId: userId } },
        select: { id: true },
      })
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Somente alunos matriculados neste curso podem gerar o resumo.' },
          { status: 403 }
        )
      }
    }

    // 1) Cache: resumo já gerado antes → devolve na hora
    const cachedSummary = await db.aiLessonSummary.findUnique({ where: { lessonId } })
    if (cachedSummary && cachedSummary.summary) {
      let keyPoints: string[] = []
      try {
        keyPoints = normalizeKeyPoints(JSON.parse(cachedSummary.keyPoints))
      } catch {
        keyPoints = []
      }
      return NextResponse.json({ summary: cachedSummary.summary, keyPoints, cached: true })
    }

    // 2) Monta o material da aula (texto próprio ou da Biblioteca)
    const material =
      (lesson.content || lesson.libraryItem?.content || '').slice(0, CONTENT_LIMIT).trim() ||
      [lesson.description, lesson.libraryItem?.description].filter(Boolean).join(' — ').trim()

    if (!material) {
      return NextResponse.json(
        { error: 'Esta aula ainda não tem material suficiente para gerar um resumo.' },
        { status: 400 }
      )
    }

    // 3) Chama o modelo
    const systemPrompt = [
      'Você é o gerador de resumos de estudo do MentorHub, uma plataforma brasileira de cursos e mentorias.',
      'Gere resumos claros, objetivos e fiéis ao material — nunca invente conteúdo que não está lá.',
      'Responda SEMPRE apenas com JSON válido (sem markdown, sem texto fora do JSON) no formato:',
      '{"summary": "resumo em 2 a 4 frases em português do Brasil", "keyPoints": ["3 a 6 tópicos-chave curtos"]}',
    ].join(' ')

    const userPrompt = [
      `Curso: ${lesson.course.title} (categoria: ${lesson.course.category}, nível: ${lesson.course.level})`,
      lesson.theme?.title ? `Módulo/tema: ${lesson.theme.title}` : '',
      `Aula: ${lesson.title}${lesson.description ? ` — ${lesson.description}` : ''}`,
      '',
      'Material da aula:',
      material,
    ]
      .filter(Boolean)
      .join('\n')

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = (completion.choices[0]?.message?.content ?? '').trim()
    if (!raw) {
      return NextResponse.json(
        { error: 'A IA não conseguiu gerar o resumo agora. Tente novamente.' },
        { status: 502 }
      )
    }

    // 4) Parse tolerante: JSON bem-formado ou fallback (texto cru como resumo)
    const parsed = extractJson(raw)
    const summary =
      typeof parsed?.summary === 'string' && parsed.summary.trim().length > 0
        ? parsed.summary.trim().slice(0, 2000)
        : raw.slice(0, 2000)
    const keyPoints = normalizeKeyPoints(parsed?.keyPoints)

    // 5) Cacheia para os próximos alunos
    await db.aiLessonSummary.upsert({
      where: { lessonId },
      create: { lessonId, summary, keyPoints: JSON.stringify(keyPoints) },
      update: { summary, keyPoints: JSON.stringify(keyPoints) },
    })

    return NextResponse.json({ summary, keyPoints, cached: false })
  } catch (err) {
    console.error('POST /api/lessons/[lessonId]/ai-summary', err)
    return NextResponse.json(
      { error: 'Erro ao gerar o resumo com IA. Tente novamente.' },
      { status: 500 }
    )
  }
}
