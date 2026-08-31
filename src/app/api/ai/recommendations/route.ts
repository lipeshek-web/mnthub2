import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'
import { courseBaseInclude, serializeCourse } from '@/lib/course-serialize'
import { clientIp, rateLimit, tooMany } from '@/lib/rate-limit'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

const CATALOG_LIMIT = 24 // cursos enviados ao modelo
const PICKS = 4 // recomendações devolvidas
const CACHE_TTL_MS = 10 * 60 * 1000 // cache em memória por usuário

/** Cache simples em memória (userId → resposta + timestamp) com varredura TTL */
const cache = new Map<string, { at: number; payload: unknown }>()
let lastCacheSweep = 0
function sweepCache() {
  const now = Date.now()
  if (now - lastCacheSweep < 60_000) return
  lastCacheSweep = now
  for (const [key, entry] of cache) {
    if (now - entry.at > CACHE_TTL_MS) cache.delete(key)
  }
}

function extractJson(text: string): { picks?: unknown } | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

function parseCompletedIds(json: string): string[] {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/**
 * GET /api/ai/recommendations
 * "Feito para você": a IA cruza o histórico do aluno com o catálogo e escolhe
 * até 4 cursos com um motivo curto. Sem histórico (ou se a IA falhar),
 * cai para os cursos mais populares da plataforma.
 */
export async function GET(req: NextRequest) {
  try {
    // Sessão — recomendações (custo de LLM) eram geradas para qualquer userId
    const session = await resolveUser(req)
    if (!session) return unauthorized('Entre com sua conta para ver recomendações.')
    const userId = session.id
    // Rate limit: 12 recomendações/min por usuário+IP (chamada custa LLM)
    const gate = rateLimit(`ai-rec:${userId}:${clientIp(req)}`, 12, 60_000)
    if (!gate.ok) return tooMany(gate.retryAfterSec)

    sweepCache() // varre entradas expiradas (Map não cresce sem limite)

    // 1) Cache hit
    const hit = cache.get(userId)
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return NextResponse.json(hit.payload)
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, xp: true, studyStreak: true },
    })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    // 2) Histórico: inscrições com progresso
    const enrollments = await db.enrollment.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        completedLessonIds: true,
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            level: true,
            lessons: { select: { id: true } },
          },
        },
      },
    })

    const history = enrollments.map((e) => {
      const total = e.course.lessons.length || 1
      const done = parseCompletedIds(e.completedLessonIds).length
      return {
        title: e.course.title,
        category: e.course.category,
        level: e.course.level,
        progressPct: Math.min(100, Math.round((done / total) * 100)),
      }
    })

    // Catálogo: publicados, do próprio usuário fora, já matriculados fora
    const catalog = await db.course.findMany({
      where: {
        isPublished: true,
        mentor: { is: { userId: { not: userId } } },
        enrollments: { none: { studentId: userId } },
      },
      include: courseBaseInclude(),
      orderBy: { createdAt: 'desc' },
      take: 60,
    })
    const serialized = catalog.map(serializeCourse)

    // 3) Fast path: sem histórico → populares (sem gastar chamada de IA)
    const popular = [...serialized]
      .sort(
        (a, b) =>
          b.studentCount * 2 + b.rating * (b.reviewCount + 1) -
          (a.studentCount * 2 + a.rating * (a.reviewCount + 1))
      )
      .slice(0, PICKS)
    const fallback = () => ({
      items: popular.map((c) => ({
        course: c,
        reason:
          c.reviewCount > 0
            ? `Muito bem avaliado pelos alunos (${c.rating.toFixed(1)}★)`
            : 'Um dos cursos mais populares da plataforma',
      })),
      generated: false,
    })

    if (history.length === 0 || serialized.length === 0) {
      const payload = fallback()
      cache.set(userId, { at: Date.now(), payload })
      return NextResponse.json(payload)
    }

    // 4) IA: escolhe 4 cursos com motivo personalizado
    try {
      const catalogForAi = serialized.slice(0, CATALOG_LIMIT).map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        level: c.level,
        price: c.price,
        rating: c.rating,
        students: c.studentCount,
        lessons: c.lessonCount,
        mentor: c.mentor.name,
      }))

      const systemPrompt = [
        'Você é o motor de recomendações do MentorHub, plataforma brasileira de cursos e mentorias.',
        'Dado o histórico do aluno e o catálogo disponível, escolha os 4 cursos com maior chance de engajá-lo.',
        'Responda SEMPRE apenas com JSON válido (sem markdown, sem texto fora do JSON):',
        '{"picks": [{"id": "<id do curso>", "reason": "motivo curto e pessoal, 1 frase, máx 90 caracteres"}]}',
        'Regras: use apenas ids do catálogo; escreva em português do Brasil; citar continuidade de categoria/nível é um plus.',
      ].join(' ')

      const userPrompt = JSON.stringify(
        {
          aluno: {
            cursosEmAndamento: history,
            xp: user.xp,
            ofensivaDeEstudos: user.studyStreak,
          },
          catalogo: catalogForAi,
        },
        null,
        0
      )

      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' },
      })

      const raw = (completion.choices[0]?.message?.content ?? '').trim()
      const parsed = extractJson(raw)
      const picks = Array.isArray(parsed?.picks) ? parsed?.picks : []
      const byId = new Map(serialized.map((c) => [c.id, c]))

      const items: { course: (typeof serialized)[number]; reason: string }[] = []
      for (const pick of picks) {
        const p = pick as { id?: unknown; reason?: unknown }
        const course = typeof p.id === 'string' ? byId.get(p.id) : undefined
        const reason =
          typeof p.reason === 'string' ? p.reason.trim().slice(0, 110) : 'Recomendado para você'
        if (course && !items.some((i) => i.course.id === course.id)) {
          items.push({ course, reason })
        }
        if (items.length >= PICKS) break
      }

      // IA não devolveu nada utilizável → fallback
      if (items.length === 0) {
        const payload = fallback()
        cache.set(userId, { at: Date.now(), payload })
        return NextResponse.json(payload)
      }

      const payload = { items, generated: true }
      cache.set(userId, { at: Date.now(), payload })
      return NextResponse.json(payload)
    } catch (aiErr) {
      console.error('GET /api/ai/recommendations (ai)', aiErr)
      const payload = fallback()
      cache.set(userId, { at: Date.now(), payload })
      return NextResponse.json(payload)
    }
  } catch (err) {
    console.error('GET /api/ai/recommendations', err)
    return NextResponse.json(
      { error: 'Erro ao gerar recomendações.' },
      { status: 500 }
    )
  }
}
