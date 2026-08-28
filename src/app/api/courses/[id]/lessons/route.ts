import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** POST /api/courses/[id]/lessons — adiciona aula ao curso (somente dono) */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const course = await db.course.findUnique({ where: { id }, include: { mentor: true } })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    if (course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão neste curso.' }, { status: 403 })
    }

    const title = String(body?.title ?? '').trim()
    const description = String(body?.description ?? '').trim()
    const videoUrl = String(body?.videoUrl ?? '').trim() || null
    const content = String(body?.content ?? '').trim() || null
    const durationMin = Number(body?.durationMin ?? 10)
    const kind = ['RECORDED', 'TEXT', 'LIVE'].includes(body?.kind) ? body.kind : videoUrl ? 'RECORDED' : content ? 'TEXT' : 'RECORDED'
    const startsAt = String(body?.startsAt ?? '').trim() || null
    const meetingUrl = String(body?.meetingUrl ?? '').trim() || null

    // Anexos: [{ name, url }]
    let attachments: { name: string; url: string }[] = []
    if (Array.isArray(body?.attachments)) {
      attachments = body.attachments
        .filter((a: unknown) => a && typeof a === 'object')
        .map((a: { name?: unknown; url?: unknown }) => ({
          name: String(a.name ?? 'Anexo').slice(0, 120),
          url: String(a.url ?? '').slice(0, 300),
        }))
        .filter((a: { url: string }) => a.url)
        .slice(0, 10)
    }

    if (title.length < 3) {
      return NextResponse.json({ error: 'Dê um título à aula (mín. 3 caracteres).' }, { status: 400 })
    }
    if (!Number.isFinite(durationMin) || durationMin <= 0) {
      return NextResponse.json({ error: 'Informe a duração em minutos.' }, { status: 400 })
    }
    if (kind === 'LIVE' && !startsAt) {
      return NextResponse.json({ error: 'Aulas ao vivo precisam de data e hora.' }, { status: 400 })
    }
    if (kind === 'LIVE' && !meetingUrl && !videoUrl) {
      return NextResponse.json(
        { error: 'A live precisa do link da transmissão (ou da gravação).' },
        { status: 400 }
      )
    }
    if (kind !== 'LIVE' && !videoUrl && !content && attachments.length === 0) {
      return NextResponse.json(
        { error: 'A aula precisa de um vídeo, conteúdo textual ou anexos.' },
        { status: 400 }
      )
    }

    const last = await db.lesson.findFirst({ where: { courseId: id }, orderBy: { order: 'desc' } })
    const lesson = await db.lesson.create({
      data: {
        courseId: id,
        title,
        description,
        kind,
        videoUrl,
        content,
        startsAt,
        meetingUrl,
        attachments: JSON.stringify(attachments),
        durationMin,
        order: (last?.order ?? 0) + 1,
      },
    })

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      kind: lesson.kind,
      videoUrl: lesson.videoUrl,
      content: lesson.content,
      startsAt: lesson.startsAt,
      meetingUrl: lesson.meetingUrl,
      attachments,
      durationMin: lesson.durationMin,
      questionCount: 0,
      order: lesson.order,
    })
  } catch (err) {
    console.error('POST /api/courses/[id]/lessons', err)
    return NextResponse.json({ error: 'Erro ao adicionar aula' }, { status: 500 })
  }
}

/** DELETE /api/courses/[id]/lessons?userId=&lessonId= — remove aula (somente dono) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const sp = req.nextUrl.searchParams
    const userId = (sp.get('userId') || '').trim()
    const lessonId = (sp.get('lessonId') || '').trim()
    if (!userId || !lessonId) {
      return NextResponse.json({ error: 'Usuário ou aula não informados.' }, { status: 400 })
    }

    const course = await db.course.findUnique({ where: { id }, include: { mentor: true } })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    if (course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão neste curso.' }, { status: 403 })
    }

    const lesson = await db.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson || lesson.courseId !== id) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })
    }

    await db.lesson.delete({ where: { id: lessonId } })
    // Remove a aula da lista de conclusão de todas as matrículas
    const enrollments = await db.enrollment.findMany({ where: { courseId: id } })
    for (const enr of enrollments) {
      try {
        const arr = JSON.parse(enr.completedLessonIds || '[]') as string[]
        if (Array.isArray(arr) && arr.includes(lessonId)) {
          await db.enrollment.update({
            where: { id: enr.id },
            data: { completedLessonIds: JSON.stringify(arr.filter((x) => x !== lessonId)) },
          })
        }
      } catch {
        // ignora JSON inválido
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/courses/[id]/lessons', err)
    return NextResponse.json({ error: 'Erro ao remover aula' }, { status: 500 })
  }
}
