import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bundleBaseInclude, serializeBundle, serializeBundleDetail } from '@/lib/bundle-serialize'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bundles — lista pacotes publicados.
 * Filtros: mentorUserId (inclui rascunhos — SOMENTE do próprio usuário da sessão),
 * courseId (pacotes publicados que contêm o curso — callout na página do curso).
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const mentorUserId = (sp.get('mentorUserId') || '').trim()
    const courseId = (sp.get('courseId') || '').trim()
    const userId = (sp.get('userId') || '').trim() // p/ myEnrolledCourseIds

    const session = await resolveUser(req)
    const canSeeDrafts = Boolean(mentorUserId) && session?.id === mentorUserId

    const where: Record<string, unknown> = {}
    if (canSeeDrafts) {
      where.mentor = { userId: mentorUserId } // painel do mentor: tudo
    } else if (courseId) {
      where.isPublished = true
      where.items = { some: { courseId } }
    } else {
      where.isPublished = true
    }

    const bundles = await db.bundle.findMany({
      where,
      include: bundleBaseInclude(),
      orderBy: { createdAt: 'desc' },
      take: 60,
    })

    // Matrículas do usuário nos cursos dos pacotes (checkout/own view)
    let enrolledIds = new Set<string>()
    if (userId) {
      const allCourseIds = [...new Set(bundles.flatMap((b) => b.items.map((i) => i.courseId)))]
      const enrolls = await db.enrollment.findMany({
        where: { studentId: userId, courseId: { in: allCourseIds } },
        select: { courseId: true },
      })
      enrolledIds = new Set(enrolls.map((e) => e.courseId))
    }

    return NextResponse.json({
      bundles: bundles.map((b) =>
        mentorUserId
          ? serializeBundle(b) // painel não precisa do estado de matrícula
          : serializeBundleDetail(b, [...enrolledIds].filter((cid) => b.items.some((i) => i.courseId === cid)))
      ),
    })
  } catch (err) {
    console.error('GET /api/bundles', err)
    return NextResponse.json({ error: 'Erro ao carregar pacotes.' }, { status: 500 })
  }
}

/** Validação compartilhada de criação/edição do pacote */
async function resolveOwner(userId: string) {
  const profile = await db.mentorProfile.findUnique({ where: { userId } })
  if (!profile) return null
  return profile
}

/**
 * POST /api/bundles — cria ou atualiza um pacote do mentor da SESSÃO.
 * Body: { id?, title, description?, price, courseIds[], isPublished? }
 * Regras: dono do perfil · 2+ cursos próprios · price ≥ 0.
 */
export async function POST(req: NextRequest) {
  try {
    // Sessão em vez de userId do body — montar pacote no perfil de outro mentor (IDOR)
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente para salvar o pacote.')
    const body = await req.json().catch(() => ({}))
    const userId = session.id
    const id = String(body?.id ?? '').trim()
    const title = String(body?.title ?? '').trim()
    const description = String(body?.description ?? '').trim().slice(0, 500)
    const price = Number(body?.price)
    const isPublished = body?.isPublished !== false
    const courseIds: string[] = Array.isArray(body?.courseIds)
      ? Array.from(new Set<string>(body.courseIds.map((c: unknown) => String(c)).filter(Boolean)))
      : []

    if (!title) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }
    if (courseIds.length < 2) {
      return NextResponse.json(
        { error: 'Escolha pelo menos 2 cursos para o pacote.' },
        { status: 400 }
      )
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Informe um preço válido.' }, { status: 400 })
    }

    const profile = await resolveOwner(userId)
    if (!profile) {
      return NextResponse.json({ error: 'Perfil de mentor não encontrado.' }, { status: 403 })
    }

    // Todos os cursos devem ser do próprio mentor
    const courses = await db.course.findMany({
      where: { id: { in: courseIds }, mentorId: profile.id },
      select: { id: true, isPublished: true },
    })
    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: 'Selecione apenas cursos seus.' },
        { status: 403 }
      )
    }

    // Atualização (bloqueio de propriedade no servidor)
    if (id) {
      const existing = await db.bundle.findUnique({ where: { id } })
      if (!existing || existing.mentorId !== profile.id) {
        return NextResponse.json({ error: 'Pacote não encontrado.' }, { status: 404 })
      }
      await db.bundle.update({
        where: { id },
        data: {
          title,
          description,
          price: Math.round(price * 100) / 100,
          isPublished,
        },
      })
      // Reposiciona itens (deleteMany + recreate mantém a ordem escolhida)
      await db.bundleItem.deleteMany({ where: { bundleId: id } })
      await db.bundleItem.createMany({
        data: courseIds.map((courseId, i) => ({ bundleId: id, courseId, order: i })),
      })
      return NextResponse.json({ id })
    }

    const bundle = await db.bundle.create({
      data: {
        mentorId: profile.id,
        title,
        description,
        price: Math.round(price * 100) / 100,
        isPublished,
        items: {
          create: courseIds.map((courseId, i) => ({ courseId, order: i })),
        },
      },
    })
    return NextResponse.json({ id: bundle.id }, { status: 201 })
  } catch (err) {
    console.error('POST /api/bundles', err)
    return NextResponse.json({ error: 'Erro ao salvar o pacote.' }, { status: 500 })
  }
}
