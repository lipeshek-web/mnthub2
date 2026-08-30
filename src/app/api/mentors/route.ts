import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MENTOR_FONT_IDS } from '@/lib/fonts'
import { normalizeText, slugify } from '@/lib/helpers'

export const dynamic = 'force-dynamic'

/** Valida id de fonte do catálogo (src/lib/fonts.ts); null = padrão da plataforma */
function fontKey(v: unknown): string | null {
  const s = String(v ?? '').trim()
  return s && MENTOR_FONT_IDS.has(s) ? s : null
}

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
    const search = normalizeText((sp.get('search') || '').trim())
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
        avatarUrl: m.user.avatarUrl,
        coverUrl: m.coverUrl,
        slug: m.slug,
      }
    })

    if (search) {
      items = items.filter((m) =>
        normalizeText([m.name, m.headline, ...m.categories].join(' ')).includes(search)
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

    // Rastreamento (tráfego pago próprio do mentor)
    const gaRaw = clean(body?.gaMeasurementId, 40)
    const gaMeasurementId = gaRaw && /^g-[a-z0-9-]+$/i.test(gaRaw) ? gaRaw.toUpperCase() : null
    const pxRaw = clean(body?.metaPixelId, 32)
    const metaPixelId = pxRaw && /^[0-9]{14,20}$/.test(pxRaw) ? pxRaw : null

    const avatarUrl = clean(body?.avatarUrl, 300)
    const coverUrl = clean(body?.coverUrl, 300)

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
      // Campos enviados apenas pelo painel do mentor: undefined = manter atual
      coverUrl: body?.coverUrl !== undefined ? coverUrl : undefined,
      // Tipografia da página do criador (mesma regra: undefined = manter, null/inválido = padrão)
      fontHeading: body?.fontHeading !== undefined ? fontKey(body.fontHeading) : undefined,
      fontBody: body?.fontBody !== undefined ? fontKey(body.fontBody) : undefined,
      gaMeasurementId: body?.gaMeasurementId !== undefined ? gaMeasurementId : undefined,
      metaPixelId: body?.metaPixelId !== undefined ? metaPixelId : undefined,
    }

    const existing = await db.mentorProfile.findUnique({ where: { userId } })

    // Slug público único (para a LP rastreável ?mentor=slug)
    const baseSlug = slugify(user.name)
    let slug = existing?.slug ?? baseSlug
    if (!existing) {
      let attempt = 1
      while (await db.mentorProfile.findUnique({ where: { slug } })) {
        attempt += 1
        slug = `${baseSlug}-${attempt}`
        if (attempt > 50) {
          slug = `${baseSlug}-${Date.now().toString(36)}`
          break
        }
      }
    }

    const profile = existing
      ? await db.mentorProfile.update({ where: { id: existing.id }, data })
      : await db.mentorProfile.create({ data: { ...data, userId, slug } })

    // Foto do avatar pertence ao usuário (aparece também na navbar)
    if (body?.avatarUrl !== undefined) {
      await db.user.update({ where: { id: userId }, data: { avatarUrl } })
    }

    return NextResponse.json({ id: profile.id, slug: profile.slug, ok: true })
  } catch (err) {
    console.error('POST /api/mentors', err)
    return NextResponse.json({ error: 'Erro ao salvar perfil de mentor' }, { status: 500 })
  }
}
