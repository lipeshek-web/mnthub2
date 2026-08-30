import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { courseBaseInclude, serializeCourse } from '@/lib/course-serialize'
import { normalizeText } from '@/lib/helpers'

export const dynamic = 'force-dynamic'

const LEVELS = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO']

/** GET /api/courses?search=&category=&sort=&mentorId=&mentorUserId=
 *  mentorUserId: lista TODOS os cursos (incl. rascunhos) do mentor daquele usuário */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const search = normalizeText((sp.get('search') || '').trim())
    const category = (sp.get('category') || '').trim()
    const sort = sp.get('sort') || 'relevance'
    const mentorId = (sp.get('mentorId') || '').trim()
    const mentorUserId = (sp.get('mentorUserId') || '').trim()

    const where: Record<string, unknown> = {}
    if (mentorUserId) {
      where.mentor = { userId: mentorUserId }
    } else {
      if (mentorId) where.mentorId = mentorId
      where.isPublished = true
    }

    const courses = await db.course.findMany({
      where,
      include: courseBaseInclude(),
      orderBy: { createdAt: 'desc' },
    })

    let items = courses.map(serializeCourse)

    if (search) {
      items = items.filter((c) =>
        normalizeText([c.title, c.description, c.mentor.name, c.category].join(' ')).includes(search)
      )
    }
    if (category) {
      items = items.filter((c) => c.category === category)
    }

    switch (sort) {
      case 'price_asc':
        items.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        items.sort((a, b) => b.price - a.price)
        break
      case 'popular':
        items.sort(
          (a, b) => b.studentCount - a.studentCount || b.rating - a.rating || b.lessonCount - a.lessonCount
        )
        break
      case 'new':
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        break
      default:
        items.sort(
          (a, b) =>
            b.studentCount * 2 +
            b.mentor.rating * (b.mentor.reviewCount + 1) -
            (a.studentCount * 2 + a.mentor.rating * (a.mentor.reviewCount + 1))
        )
    }

    return NextResponse.json(items)
  } catch (err) {
    console.error('GET /api/courses', err)
    return NextResponse.json({ error: 'Erro ao listar cursos' }, { status: 500 })
  }
}

/** POST /api/courses — cria curso para o mentor do usuário informado */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const mentor = await db.mentorProfile.findUnique({ where: { userId } })
    if (!mentor) {
      return NextResponse.json(
        { error: 'Crie seu perfil de mentor antes de publicar cursos.' },
        { status: 400 }
      )
    }

    const title = String(body?.title ?? '').trim()
    const description = String(body?.description ?? '').trim()
    const category = String(body?.category ?? '').trim()
    const level = LEVELS.includes(body?.level) ? body.level : 'INICIANTE'
    const price = Number(body?.price ?? 0)
    const coverUrl = body?.coverUrl ? String(body.coverUrl).trim().slice(0, 300) : null
    const mentorshipCount = Math.max(0, Math.min(20, Math.round(Number(body?.mentorshipCount ?? 0) || 0)))

    if (title.length < 5) {
      return NextResponse.json(
        { error: 'O título do curso precisa de ao menos 5 caracteres.' },
        { status: 400 }
      )
    }
    if (description.length < 30) {
      return NextResponse.json({ error: 'Descreva o curso com pelo menos 30 caracteres.' }, { status: 400 })
    }
    if (!category) {
      return NextResponse.json({ error: 'Selecione a categoria do curso.' }, { status: 400 })
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Informe um preço válido (0 = gratuito).' }, { status: 400 })
    }

    const created = await db.course.create({
      data: { mentorId: mentor.id, title, description, category, level, price, coverUrl, mentorshipCount },
    })
    return NextResponse.json({ id: created.id, ok: true })
  } catch (err) {
    console.error('POST /api/courses', err)
    return NextResponse.json({ error: 'Erro ao criar curso' }, { status: 500 })
  }
}
