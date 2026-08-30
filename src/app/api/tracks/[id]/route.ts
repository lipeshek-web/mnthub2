import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  parseTrackItems,
  serializeTrack,
  trackBaseInclude,
  type TrackRow,
} from '@/lib/tracks-serialize'

export const dynamic = 'force-dynamic'

const LEVELS = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO']

/** GET /api/tracks/[id]?userId= — detalhe da trilha (+ progresso do usuário) */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()

    const track = (await db.track.findUnique({
      where: { id },
      include: {
        mentor: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            reviews: { select: { rating: true } },
          },
        },
        items: {
          orderBy: { order: 'asc' },
          include: {
            course: {
              include: {
                lessons: { select: { durationMin: true, kind: true } },
                enrollments: { select: { id: true } },
              },
            },
          },
        },
        enrollments: { select: { id: true } },
      },
    })) as unknown as TrackRow

    if (!track) return NextResponse.json({ error: 'Trilha não encontrada.' }, { status: 404 })

    const base = serializeTrack(track)

    // Detalhe dos itens: cursos completos + progresso do usuário
    let myEnrollment: { createdAt: string } | null = null
    const courseProgress: Record<string, { completed: number; total: number }> = {}
    const trackCourseIds = track.items.filter((i) => i.type === 'COURSE' && i.course).map((i) => i.course!.id)
    if (userId) {
      const enr = await db.trackEnrollment.findUnique({
        where: { trackId_studentId: { trackId: id, studentId: userId } },
      })
      if (enr) myEnrollment = { createdAt: enr.createdAt.toISOString() }

      if (trackCourseIds.length > 0) {
        const myCourseEnrollments = await db.enrollment.findMany({
          where: { studentId: userId, courseId: { in: trackCourseIds } },
          select: { courseId: true, completedLessonIds: true },
        })
        const totals = new Map<string, number>()
        for (const item of track.items) {
          if (item.type === 'COURSE' && item.course) {
            totals.set(item.course.id, item.course.lessons.length)
          }
        }
        for (const ce of myCourseEnrollments) {
          let completedIds: string[] = []
          try {
            const parsed = JSON.parse(ce.completedLessonIds || '[]')
            if (Array.isArray(parsed)) completedIds = parsed.map(String)
          } catch {
            completedIds = []
          }
          courseProgress[ce.courseId] = {
            completed: completedIds.length,
            total: totals.get(ce.courseId) ?? 0,
          }
        }
      }
    }

    const detailedItems = track.items.map((item) => {
      if (item.type === 'COURSE' && item.course) {
        const c = item.course
        return {
          id: item.id,
          type: 'COURSE' as const,
          title: c.title,
          description: item.description,
          courseId: c.id,
          coverUrl: c.coverUrl,
          lessonCount: c.lessons.length,
          liveCount: c.lessons.filter((l) => l.kind === 'LIVE').length,
          totalDurationMin: c.lessons.reduce((a, l) => a + l.durationMin, 0),
          mentorshipCount: c.mentorshipCount,
          studentCount: c.enrollments.length,
          sessionCount: item.sessionCount,
        }
      }
      return {
        id: item.id,
        type: 'MENTORSHIP' as const,
        title: item.title ?? 'Mentoria',
        description: item.description,
        sessionCount: item.sessionCount,
        courseId: null as string | null,
        coverUrl: null as string | null,
        lessonCount: 0,
        liveCount: 0,
        totalDurationMin: 0,
        mentorshipCount: 0,
        studentCount: 0,
      }
    })

    return NextResponse.json({
      ...base,
      items: detailedItems,
      myEnrollment,
      courseProgress,
    })
  } catch (err) {
    console.error('GET /api/tracks/[id]', err)
    return NextResponse.json({ error: 'Erro ao carregar trilha' }, { status: 500 })
  }
}

/** PATCH /api/tracks/[id] — atualiza trilha (somente dono) */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const track = await db.track.findUnique({ where: { id }, include: { mentor: true } })
    if (!track) return NextResponse.json({ error: 'Trilha não encontrada.' }, { status: 404 })
    if (track.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão para editar esta trilha.' }, { status: 403 })
    }

    const data: Record<string, unknown> = {}
    if (body?.title !== undefined) {
      const title = String(body.title).trim()
      if (title.length < 5) {
        return NextResponse.json({ error: 'O título precisa de ao menos 5 caracteres.' }, { status: 400 })
      }
      data.title = title
    }
    if (body?.description !== undefined) {
      const description = String(body.description).trim()
      if (description.length < 30) {
        return NextResponse.json({ error: 'A descrição precisa de ao menos 30 caracteres.' }, { status: 400 })
      }
      data.description = description
    }
    if (body?.category !== undefined) {
      const category = String(body.category).trim()
      if (!category) return NextResponse.json({ error: 'Categoria inválida.' }, { status: 400 })
      data.category = category
    }
    if (body?.level !== undefined) {
      if (!LEVELS.includes(body.level)) {
        return NextResponse.json({ error: 'Nível inválido.' }, { status: 400 })
      }
      data.level = body.level
    }
    if (body?.price !== undefined) {
      const price = Number(body.price)
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: 'Preço inválido.' }, { status: 400 })
      }
      data.price = price
    }
    if (body?.coverUrl !== undefined) {
      data.coverUrl = body.coverUrl ? String(body.coverUrl).trim().slice(0, 300) : null
    }
    if (body?.isPublished !== undefined) {
      data.isPublished = Boolean(body.isPublished)
    }

    await db.track.update({ where: { id }, data })

    // Itens: se enviados, substitui todos
    if (Array.isArray(body?.items)) {
      const parsed = await parseTrackItems(body.items, track.mentor.id)
      if (parsed.error || parsed.items.length === 0) {
        return NextResponse.json(
          { error: parsed.error || 'A trilha precisa de ao menos um item.' },
          { status: 400 }
        )
      }
      await db.trackItem.deleteMany({ where: { trackId: id } })
      await db.trackItem.createMany({
        data: parsed.items.map((item, i) => ({ ...item, trackId: id, order: i + 1 })),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/tracks/[id]', err)
    return NextResponse.json({ error: 'Erro ao atualizar trilha' }, { status: 500 })
  }
}

/** DELETE /api/tracks/[id]?userId= — remove trilha (somente dono) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const track = await db.track.findUnique({ where: { id }, include: { mentor: true } })
    if (!track) return NextResponse.json({ error: 'Trilha não encontrada.' }, { status: 404 })
    if (track.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão para excluir esta trilha.' }, { status: 403 })
    }

    await db.track.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/tracks/[id]', err)
    return NextResponse.json({ error: 'Erro ao excluir trilha' }, { status: 500 })
  }
}
