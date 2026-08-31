import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

const KINDS = ['ARTICLE', 'BOOK']
const LEVELS = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO']

/** GET /api/library/[id] — detalhe do artigo/livro.
 *  canRead: publicado OU autor OU inscrito em qualquer curso que use o item em uma aula.
 *  pdfUrl/content só vêm preenchidos quando canRead.
 *  Identidade SEMPRE pela sessão — userId por query deixava qualquer um ler
 *  PDF/texto restrito passando o id de um aluno inscrito (IDOR de conteúdo). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const session = await resolveUser(req)
    const userId = session?.id ?? ''

    const item = await db.libraryItem.findUnique({
      where: { id },
      include: {
        mentor: {
          select: {
            id: true,
            userId: true,
            headline: true,
            user: { select: { name: true, avatarUrl: true } },
          },
        },
        _count: { select: { lessons: true } },
        lessons: {
          select: {
            course: {
              select: {
                id: true,
                title: true,
                enrollments: { select: { studentId: true } },
              },
            },
          },
        },
      },
    })
    if (!item) return NextResponse.json({ error: 'Conteúdo não encontrado.' }, { status: 404 })

    // Cursos únicos que usam este item (máx. 5) + verificação de inscrição do usuário
    const courseMap = new Map<string, { id: string; title: string }>()
    let enrolled = false
    for (const lesson of item.lessons) {
      const course = lesson.course
      if (!course) continue
      if (!courseMap.has(course.id)) courseMap.set(course.id, { id: course.id, title: course.title })
      if (userId && !enrolled && course.enrollments.some((e) => e.studentId === userId)) {
        enrolled = true
      }
    }
    const linkedCourses = Array.from(courseMap.values()).slice(0, 5)

    const isAuthor = Boolean(userId) && item.mentor.userId === userId
    const canRead = item.isPublished || isAuthor || enrolled

    return NextResponse.json({
      id: item.id,
      kind: item.kind,
      title: item.title,
      description: item.description,
      category: item.category,
      level: item.level,
      coverUrl: item.coverUrl,
      readingMin: item.readingMin,
      isPublished: item.isPublished,
      hasPdf: Boolean(item.pdfUrl),
      hasText: Boolean(item.content),
      createdAt: item.createdAt.toISOString(),
      author: {
        id: item.mentor.id,
        userId: item.mentor.userId,
        name: item.mentor.user.name,
        headline: item.mentor.headline,
        avatarUrl: item.mentor.user.avatarUrl,
      },
      usageCount: item._count.lessons,
      linkedCourses,
      pdfUrl: canRead ? item.pdfUrl : null,
      content: canRead ? item.content : null,
      canRead,
    })
  } catch (err) {
    console.error('GET /api/library/[id]', err)
    return NextResponse.json({ error: 'Erro ao carregar conteúdo' }, { status: 500 })
  }
}

/** PATCH /api/library/[id] — atualiza item (somente o autor/mentor dono) */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    // Sessão em vez de userId do body — editar conteúdo de outro mentor (IDOR)
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente para salvar.')
    const { id } = await ctx.params
    const body = await req.json()
    const userId = session.id

    const item = await db.libraryItem.findUnique({ where: { id }, include: { mentor: true } })
    if (!item) return NextResponse.json({ error: 'Conteúdo não encontrado.' }, { status: 404 })
    if (item.mentor.userId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar este conteúdo.' },
        { status: 403 }
      )
    }

    const data: Record<string, unknown> = {}
    if (body?.kind !== undefined) {
      if (!KINDS.includes(body.kind)) {
        return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
      }
      data.kind = body.kind
    }
    if (body?.title !== undefined) {
      const title = String(body.title).trim()
      if (title.length < 3) {
        return NextResponse.json(
          { error: 'O título precisa de ao menos 3 caracteres.' },
          { status: 400 }
        )
      }
      data.title = title
    }
    if (body?.description !== undefined) data.description = String(body.description).trim()
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
    if (body?.coverUrl !== undefined) {
      data.coverUrl = body.coverUrl ? String(body.coverUrl).trim().slice(0, 500) : null
    }
    if (body?.pdfUrl !== undefined) {
      data.pdfUrl = body.pdfUrl ? String(body.pdfUrl).trim().slice(0, 500) : null
    }
    if (body?.content !== undefined) {
      data.content = body.content ? String(body.content) : null
    }
    if (body?.readingMin !== undefined) {
      const readingMin = Math.round(Number(body.readingMin))
      if (!Number.isFinite(readingMin) || readingMin < 1) {
        return NextResponse.json({ error: 'Tempo de leitura inválido.' }, { status: 400 })
      }
      data.readingMin = readingMin
    }
    if (body?.isPublished !== undefined) data.isPublished = Boolean(body.isPublished)

    await db.libraryItem.update({ where: { id }, data })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/library/[id]', err)
    return NextResponse.json({ error: 'Erro ao atualizar conteúdo' }, { status: 500 })
  }
}

/** DELETE /api/library/[id] — remove item (somente dono); aulas ficam com libraryItemId null (SetNull) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    // Sessão em vez de userId da query — excluir conteúdo de outro mentor (IDOR)
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente para excluir.')
    const { id } = await ctx.params
    const userId = session.id

    const item = await db.libraryItem.findUnique({ where: { id }, include: { mentor: true } })
    if (!item) return NextResponse.json({ error: 'Conteúdo não encontrado.' }, { status: 404 })
    if (item.mentor.userId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para excluir este conteúdo.' },
        { status: 403 }
      )
    }

    await db.libraryItem.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/library/[id]', err)
    return NextResponse.json({ error: 'Erro ao excluir conteúdo' }, { status: 500 })
  }
}
