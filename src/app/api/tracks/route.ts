import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  parseTrackItems,
  serializeTrack,
  trackBaseInclude,
  type TrackRow,
} from '@/lib/tracks-serialize'
import { normalizeText } from '@/lib/helpers'
import { resolveUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const LEVELS = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO']

/** GET /api/tracks?search=&category=&sort=&mentorUserId= — lista trilhas publicadas
 *  (ou todas do mentor, SOMENTE quando mentorUserId é o usuário da sessão) */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const search = normalizeText((sp.get('search') || '').trim())
    const category = (sp.get('category') || '').trim()
    const sort = sp.get('sort') || 'relevance'
    const mentorUserId = (sp.get('mentorUserId') || '').trim()

    const session = await resolveUser(req)
    const canSeeDrafts = Boolean(mentorUserId) && session?.id === mentorUserId

    const where: Record<string, unknown> = {}
    if (canSeeDrafts) {
      where.mentor = { userId: mentorUserId }
    } else {
      where.isPublished = true
    }

    const tracks = (await db.track.findMany({
      where,
      include: trackBaseInclude(),
      orderBy: { createdAt: 'desc' },
    })) as unknown as TrackRow[]

    let items = tracks.map(serializeTrack)

    if (search) {
      items = items.filter((t) =>
        normalizeText([t.title, t.description, t.mentor.name, t.category].join(' ')).includes(search)
      )
    }
    if (category) {
      items = items.filter((t) => t.category === category)
    }

    switch (sort) {
      case 'price_asc':
        items.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        items.sort((a, b) => b.price - a.price)
        break
      case 'popular':
        items.sort((a, b) => b.studentCount - a.studentCount || b.courseCount - a.courseCount)
        break
      case 'new':
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        break
      default:
        items.sort((a, b) => b.studentCount * 2 - a.studentCount * 2)
    }

    return NextResponse.json(items)
  } catch (err) {
    console.error('GET /api/tracks', err)
    return NextResponse.json({ error: 'Erro ao listar trilhas' }, { status: 500 })
  }
}

/** POST /api/tracks — cria trilha com itens (cursos do próprio mentor + blocos de mentoria) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const mentor = await db.mentorProfile.findUnique({ where: { userId } })
    if (!mentor) {
      return NextResponse.json(
        { error: 'Crie seu perfil de mentor antes de publicar trilhas.' },
        { status: 400 }
      )
    }

    const title = String(body?.title ?? '').trim()
    const description = String(body?.description ?? '').trim()
    const category = String(body?.category ?? '').trim()
    const level = LEVELS.includes(body?.level) ? body.level : 'INICIANTE'
    const price = Number(body?.price ?? 0)
    const coverUrl = body?.coverUrl ? String(body.coverUrl).trim().slice(0, 300) : null

    if (title.length < 5) {
      return NextResponse.json({ error: 'O título da trilha precisa de ao menos 5 caracteres.' }, { status: 400 })
    }
    if (description.length < 30) {
      return NextResponse.json({ error: 'Descreva a trilha com pelo menos 30 caracteres.' }, { status: 400 })
    }
    if (!category) {
      return NextResponse.json({ error: 'Selecione a categoria da trilha.' }, { status: 400 })
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Informe um preço válido (0 = gratuita).' }, { status: 400 })
    }

    const parsedItems = await parseTrackItems(body?.items, mentor.id)
    if ('error' in parsedItems) {
      return NextResponse.json({ error: parsedItems.error }, { status: 400 })
    }
    if (parsedItems.items.length === 0) {
      return NextResponse.json({ error: 'Adicione ao menos um curso ou mentoria à trilha.' }, { status: 400 })
    }

    const created = await db.track.create({
      data: {
        mentorId: mentor.id,
        title,
        description,
        category,
        level,
        price,
        coverUrl,
        items: {
          create: parsedItems.items.map((item, i) => ({ ...item, order: i + 1 })),
        },
      },
    })

    return NextResponse.json({ id: created.id, ok: true })
  } catch (err) {
    console.error('POST /api/tracks', err)
    return NextResponse.json({ error: 'Erro ao criar trilha' }, { status: 500 })
  }
}
