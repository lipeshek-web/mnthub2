import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** GET /api/courses/[id]/themes?userId= — lista os temas (módulos) do curso em ordem */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params

    const course = await db.course.findUnique({ where: { id }, select: { id: true } })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })

    const themes = await db.courseTheme.findMany({
      where: { courseId: id },
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
    })

    return NextResponse.json({
      themes: themes.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        order: t.order,
      })),
    })
  } catch (err) {
    console.error('GET /api/courses/[id]/themes', err)
    return NextResponse.json({ error: 'Erro ao carregar temas' }, { status: 500 })
  }
}

/** POST /api/courses/[id]/themes — cria tema (somente dono), order = max + 1 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    // Sessão em vez de userId do body — criar tema em curso alheio (IDOR)
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente.')
    const { id } = await ctx.params
    const body = await req.json()
    const userId = session.id

    const course = await db.course.findUnique({ where: { id }, include: { mentor: true } })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    if (course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão neste curso.' }, { status: 403 })
    }

    const title = String(body?.title ?? '').trim()
    if (title.length < 2) {
      return NextResponse.json({ error: 'O título do tema precisa de ao menos 2 caracteres.' }, { status: 400 })
    }
    const description = String(body?.description ?? '').trim()

    const last = await db.courseTheme.findFirst({
      where: { courseId: id },
      orderBy: { order: 'desc' },
    })
    const theme = await db.courseTheme.create({
      data: { courseId: id, title, description, order: (last?.order ?? 0) + 1 },
    })

    return NextResponse.json({
      id: theme.id,
      title: theme.title,
      description: theme.description,
      order: theme.order,
    })
  } catch (err) {
    console.error('POST /api/courses/[id]/themes', err)
    return NextResponse.json({ error: 'Erro ao criar tema' }, { status: 500 })
  }
}

/** PATCH /api/courses/[id]/themes?themeId= — atualiza tema (somente dono, tema do curso) */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const themeId = (req.nextUrl.searchParams.get('themeId') || '').trim()
    if (!themeId) return NextResponse.json({ error: 'Tema não informado.' }, { status: 400 })

    // Sessão em vez de userId do body — editar tema de curso alheio (IDOR)
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente.')
    const body = await req.json()
    const userId = session.id

    const course = await db.course.findUnique({ where: { id }, include: { mentor: true } })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    if (course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão neste curso.' }, { status: 403 })
    }

    const theme = await db.courseTheme.findUnique({ where: { id: themeId } })
    if (!theme || theme.courseId !== id) {
      return NextResponse.json({ error: 'Tema não encontrado.' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body?.title !== undefined) {
      const title = String(body.title).trim()
      if (title.length < 2) {
        return NextResponse.json({ error: 'O título do tema precisa de ao menos 2 caracteres.' }, { status: 400 })
      }
      data.title = title
    }
    if (body?.description !== undefined) {
      data.description = String(body.description).trim()
    }
    if (body?.order !== undefined) {
      const order = Number(body.order)
      if (!Number.isFinite(order)) {
        return NextResponse.json({ error: 'Ordem inválida.' }, { status: 400 })
      }
      data.order = Math.round(order)
    }

    await db.courseTheme.update({ where: { id: themeId }, data })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/courses/[id]/themes', err)
    return NextResponse.json({ error: 'Erro ao atualizar tema' }, { status: 500 })
  }
}

/** DELETE /api/courses/[id]/themes?themeId= — remove tema (somente dono); aulas ficam sem tema (SetNull) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    // Sessão em vez de userId da query — remover tema de curso alheio (IDOR)
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente.')
    const { id } = await ctx.params
    const sp = req.nextUrl.searchParams
    const themeId = (sp.get('themeId') || '').trim()
    const userId = session.id
    if (!themeId) {
      return NextResponse.json({ error: 'Tema não informado.' }, { status: 400 })
    }

    const course = await db.course.findUnique({ where: { id }, include: { mentor: true } })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    if (course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão neste curso.' }, { status: 403 })
    }

    const theme = await db.courseTheme.findUnique({ where: { id: themeId } })
    if (!theme || theme.courseId !== id) {
      return NextResponse.json({ error: 'Tema não encontrado.' }, { status: 404 })
    }

    await db.courseTheme.delete({ where: { id: themeId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/courses/[id]/themes', err)
    return NextResponse.json({ error: 'Erro ao excluir tema' }, { status: 500 })
  }
}
