import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function parseArray(s: string | null | undefined): string[] {
  try {
    const v = JSON.parse(s || '[]')
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

/** GET /api/mentors?search=&category=&sort= — lista de mentores publicados */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const search = (sp.get('search') || '').trim().toLowerCase()
    const category = (sp.get('category') || '').trim()
    const sort = sp.get('sort') || 'relevance'

    const mentors = await db.mentorProfile.findMany({
      where: { isPublished: true },
      include: {
        user: true,
        contents: true,
        reviews: true,
        bookings: { where: { status: 'COMPLETED' }, select: { id: true } },
      },
    })

    let items = mentors.map((m) => {
      const rating =
        m.reviews.length > 0
          ? m.reviews.reduce((acc, r) => acc + r.rating, 0) / m.reviews.length
          : 0
      return {
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        headline: m.headline,
        categories: parseArray(m.categories),
        hourlyRate: m.hourlyRate,
        experienceYears: m.experienceYears,
        languages: m.languages,
        socials: {
          instagram: m.instagram,
          linkedin: m.linkedin,
          github: m.github,
          website: m.website,
        },
        rating: Math.round(rating * 10) / 10,
        reviewCount: m.reviews.length,
        contentsCount: m.contents.length,
        totalSessions: m.bookings.length,
      }
    })

    if (search) {
      items = items.filter((m) =>
        [m.name, m.headline, ...m.categories].join(' ').toLowerCase().includes(search)
      )
    }
    if (category) {
      items = items.filter((m) => m.categories.includes(category))
    }

    switch (sort) {
      case 'rating':
        items.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
        break
      case 'price_asc':
        items.sort((a, b) => a.hourlyRate - b.hourlyRate)
        break
      case 'price_desc':
        items.sort((a, b) => b.hourlyRate - a.hourlyRate)
        break
      case 'experience':
        items.sort((a, b) => b.experienceYears - a.experienceYears)
        break
      default:
        items.sort(
          (a, b) =>
            b.rating * (b.reviewCount + 1) - a.rating * (a.reviewCount + 1) ||
            b.totalSessions - a.totalSessions
        )
    }

    return NextResponse.json(items)
  } catch (err) {
    console.error('GET /api/mentors', err)
    return NextResponse.json({ error: 'Erro ao listar mentores' }, { status: 500 })
  }
}

/** POST /api/mentors — cria/atualiza perfil de mentor do usuário */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const headline = String(body?.headline ?? '').trim()
    const description = String(body?.description ?? '').trim()
    const categories: string[] = Array.isArray(body?.categories) ? body.categories.map(String) : []
    const hourlyRate = Number(body?.hourlyRate ?? 0)
    const experienceYears = Number(body?.experienceYears ?? 0)
    const languages = String(body?.languages ?? 'Português').trim() || 'Português'

    const clean = (v: unknown, max = 190) => {
      const s = String(v ?? '').trim()
      return s ? s.slice(0, max) : null
    }
    const socials = (body?.socials ?? {}) as Record<string, unknown>

    if (!headline || headline.length < 8) {
      return NextResponse.json({ error: 'Escreva um título profissional (mín. 8 caracteres).' }, { status: 400 })
    }
    if (!description || description.length < 30) {
      return NextResponse.json({ error: 'Escreva uma descrição com pelo menos 30 caracteres.' }, { status: 400 })
    }
    if (categories.length === 0) {
      return NextResponse.json({ error: 'Selecione pelo menos uma área de atuação.' }, { status: 400 })
    }
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      return NextResponse.json({ error: 'Informe um valor por sessão válido.' }, { status: 400 })
    }

    const data = {
      headline,
      description,
      categories: JSON.stringify(categories),
      hourlyRate,
      experienceYears: Math.max(0, Math.min(60, Math.round(experienceYears))),
      languages,
      isPublished: true,
      instagram: clean(socials.instagram, 80),
      linkedin: clean(socials.linkedin, 190),
      github: clean(socials.github, 80),
      website: clean(socials.website, 190),
    }

    const existing = await db.mentorProfile.findUnique({ where: { userId } })
    const profile = existing
      ? await db.mentorProfile.update({ where: { id: existing.id }, data })
      : await db.mentorProfile.create({ data: { ...data, userId } })

    return NextResponse.json({ id: profile.id, ok: true })
  } catch (err) {
    console.error('POST /api/mentors', err)
    return NextResponse.json({ error: 'Erro ao salvar perfil de mentor' }, { status: 500 })
  }
}
