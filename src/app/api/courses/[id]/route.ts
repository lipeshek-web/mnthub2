import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const LEVELS = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO']

/** GET /api/courses/[id]?userId= — detalhe do curso com aulas e estado de matrícula */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()

    const course = await db.course.findUnique({
      where: { id },
      include: {
        mentor: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            reviews: { select: { rating: true } },
          },
        },
        lessons: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          include: {
            _count: { select: { questions: true } },
            libraryItem: {
              select: { id: true, title: true, kind: true, pdfUrl: true, content: true },
            },
          },
        },
        themes: { orderBy: [{ order: 'asc' }, { title: 'asc' }] },
        enrollments: { select: { id: true } },
      },
    })

    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })

    const rating =
      course.mentor.reviews.length > 0
        ? Math.round(
            (course.mentor.reviews.reduce((a, r) => a + r.rating, 0) / course.mentor.reviews.length) * 10
          ) / 10
        : 0

    const isOwner = Boolean(userId && course.mentor.userId === userId)

    let enrollment: { completedLessonIds: string[] } | null = null
    if (userId) {
      const enr = await db.enrollment.findUnique({
        where: { courseId_studentId: { courseId: id, studentId: userId } },
      })
      if (enr) {
        let completed: string[] = []
        try {
          const parsed = JSON.parse(enr.completedLessonIds || '[]')
          if (Array.isArray(parsed)) completed = parsed.map(String)
        } catch {
          completed = []
        }
        enrollment = { completedLessonIds: completed }
      }
    }

    // Material restrito (link da live + anexos) só para inscritos ou dono
    const canSeeMaterial = Boolean(enrollment) || isOwner

    return NextResponse.json({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price,
      coverUrl: course.coverUrl,
      isPublished: course.isPublished,
      mentorshipCount: course.mentorshipCount,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      mentor: {
        id: course.mentor.id,
        userId: course.mentor.userId,
        name: course.mentor.user.name,
        headline: course.mentor.headline,
        rating,
        reviewCount: course.mentor.reviews.length,
        avatarUrl: course.mentor.user.avatarUrl,
        tracking: {
          gaMeasurementId: course.mentor.gaMeasurementId,
          metaPixelId: course.mentor.metaPixelId,
        },
      },
      lessonCount: course.lessons.length,
      totalDurationMin: course.lessons.reduce((a, l) => a + l.durationMin, 0),
      liveCount: course.lessons.filter((l) => l.kind === 'LIVE').length,
      studentCount: course.enrollments.length,
      themes: course.themes.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        order: t.order,
      })),
      lessons: course.lessons.map((l) => {
        let attachments: { name: string; url: string }[] = []
        try {
          const parsed = JSON.parse(l.attachments || '[]')
          if (Array.isArray(parsed)) {
            attachments = parsed
              .filter((a) => a && typeof a === 'object')
              .map((a) => ({ name: String((a as { name?: unknown }).name ?? 'Anexo'), url: String((a as { url?: unknown }).url ?? '') }))
              .filter((a) => a.url)
          }
        } catch {
          attachments = []
        }
        return {
          id: l.id,
          title: l.title,
          description: l.description,
          kind: l.kind,
          videoUrl: l.videoUrl,
          content: l.content,
          startsAt: l.startsAt,
          meetingUrl: canSeeMaterial ? l.meetingUrl : null,
          attachments: canSeeMaterial ? attachments : [],
          hasAttachments: attachments.length > 0,
          durationMin: l.durationMin,
          questionCount: l._count.questions,
          order: l.order,
          themeId: l.themeId,
          // Leitura (artigo/livro da Biblioteca): pdfUrl/content só para inscritos ou dono
          reading: l.libraryItem
            ? {
                id: l.libraryItem.id,
                title: l.libraryItem.title,
                kind: l.libraryItem.kind,
                pdfUrl: canSeeMaterial ? l.libraryItem.pdfUrl : null,
                content: canSeeMaterial ? l.libraryItem.content : null,
              }
            : null,
        }
      }),
      enrollment,
    })
  } catch (err) {
    console.error('GET /api/courses/[id]', err)
    return NextResponse.json({ error: 'Erro ao carregar curso' }, { status: 500 })
  }
}

/** PATCH /api/courses/[id] — atualiza curso (somente dono) */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const course = await db.course.findUnique({ where: { id }, include: { mentor: true } })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    if (course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão para editar este curso.' }, { status: 403 })
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
      const coverUrl = body.coverUrl ? String(body.coverUrl).trim().slice(0, 300) : null
      data.coverUrl = coverUrl
    }
    if (body?.mentorshipCount !== undefined) {
      const mc = Math.max(0, Math.min(20, Math.round(Number(body.mentorshipCount) || 0)))
      data.mentorshipCount = mc
    }
    if (body?.isPublished !== undefined) {
      data.isPublished = Boolean(body.isPublished)
    }

    await db.course.update({ where: { id }, data })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/courses/[id]', err)
    return NextResponse.json({ error: 'Erro ao atualizar curso' }, { status: 500 })
  }
}

/** DELETE /api/courses/[id]?userId= — remove curso (somente dono) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const course = await db.course.findUnique({ where: { id }, include: { mentor: true } })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    if (course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão para excluir este curso.' }, { status: 403 })
    }

    await db.course.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/courses/[id]', err)
    return NextResponse.json({ error: 'Erro ao excluir curso' }, { status: 500 })
  }
}
