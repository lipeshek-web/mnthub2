import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizeText } from '@/lib/helpers'
import { resolveUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const KINDS = ['ARTICLE', 'BOOK']
const LEVELS = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO']

/** GET /api/library?search=&kind=&category=&sort=&authorUserId= — lista a Biblioteca.
 *  sort: 'recent' (padrão) | 'popular' (usageCount desc) | 'title'.
 *  authorUserId informado → lista TUDO do autor (inclui rascunhos) SOMENTE se for
 *  o próprio usuário da sessão; senão só isPublished=true. */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const search = normalizeText((sp.get('search') || '').trim())
    const kind = (sp.get('kind') || '').trim().toUpperCase()
    const category = (sp.get('category') || '').trim()
    const sort = sp.get('sort') || 'recent'
    const authorUserId = (sp.get('authorUserId') || '').trim()

    const session = await resolveUser(req)
    const canSeeDrafts = Boolean(authorUserId) && session?.id === authorUserId

    const where: Record<string, unknown> = {}
    if (canSeeDrafts) {
      where.mentor = { userId: authorUserId }
    } else {
      where.isPublished = true
    }
    if (KINDS.includes(kind)) where.kind = kind
    if (category) where.category = category

    const rows = await db.libraryItem.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
    })

    let items = rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      description: row.description,
      category: row.category,
      level: row.level,
      coverUrl: row.coverUrl,
      readingMin: row.readingMin,
      isPublished: row.isPublished,
      hasPdf: Boolean(row.pdfUrl),
      hasText: Boolean(row.content),
      createdAt: row.createdAt.toISOString(),
      author: {
        id: row.mentor.id,
        userId: row.mentor.userId,
        name: row.mentor.user.name,
        headline: row.mentor.headline,
        avatarUrl: row.mentor.user.avatarUrl,
      },
      usageCount: row._count.lessons,
    }))

    if (search) {
      items = items.filter((i) => normalizeText(`${i.title} ${i.description}`).includes(search))
    }

    switch (sort) {
      case 'popular':
        items.sort((a, b) => b.usageCount - a.usageCount || b.createdAt.localeCompare(a.createdAt))
        break
      case 'title':
        items.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
        break
      default: // recent
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }

    return NextResponse.json(items)
  } catch (err) {
    console.error('GET /api/library', err)
    return NextResponse.json({ error: 'Erro ao listar a Biblioteca' }, { status: 500 })
  }
}

/** POST /api/library — cria artigo/livro (exige perfil de mentor) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const mentor = await db.mentorProfile.findUnique({ where: { userId } })
    if (!mentor) {
      return NextResponse.json({ error: 'Crie seu perfil de mentor primeiro.' }, { status: 403 })
    }

    const kind = KINDS.includes(body?.kind) ? body.kind : 'ARTICLE'
    const title = String(body?.title ?? '').trim()
    if (title.length < 3) {
      return NextResponse.json(
        { error: 'O título precisa de ao menos 3 caracteres.' },
        { status: 400 }
      )
    }

    const readingMin = Math.round(Number(body?.readingMin ?? 10))
    const created = await db.libraryItem.create({
      data: {
        mentorId: mentor.id,
        kind,
        title,
        description: String(body?.description ?? '').trim(),
        category: body?.category ? String(body.category).trim() : 'Tecnologia',
        level: LEVELS.includes(body?.level) ? body.level : 'INICIANTE',
        coverUrl: body?.coverUrl ? String(body.coverUrl).trim().slice(0, 500) : null,
        pdfUrl: body?.pdfUrl ? String(body.pdfUrl).trim().slice(0, 500) : null,
        content: body?.content ? String(body.content) : null,
        readingMin: Number.isFinite(readingMin) && readingMin >= 1 ? readingMin : 10,
      },
    })

    return NextResponse.json({ id: created.id, ok: true })
  } catch (err) {
    console.error('POST /api/library', err)
    return NextResponse.json({ error: 'Erro ao criar item da Biblioteca' }, { status: 500 })
  }
}
