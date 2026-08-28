import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/checkout — finaliza a compra de um curso ou trilha pago (checkout demonstrativo):
 * cria o pedido + matrícula(s) + evento de conversão (purchase) com atribuição,
 * para alimentar o funil e os relatórios de tráfego pago do mentor.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = String(body?.userId ?? '')
    const courseId = String(body?.courseId ?? '')
    const trackId = String(body?.trackId ?? '')
    const paymentMethod = body?.paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX'

    if (!userId || (!courseId && !trackId) || (courseId && trackId)) {
      return NextResponse.json({ error: 'Dados incompletos para o checkout.' }, { status: 400 })
    }

    const attr = (body?.attribution ?? {}) as Record<string, unknown>
    const s = (v: unknown, max = 190) => {
      const str = String(v ?? '').trim()
      return str ? str.slice(0, max) : null
    }
    const channel = s(attr.channel, 40) || 'direct'
    const landingPage = attr.landingPage === 'mentor_lp' ? 'mentor_lp' : 'platform'
    const attributionFields = {
      utmSource: s(attr.utmSource),
      utmMedium: s(attr.utmMedium),
      utmCampaign: s(attr.utmCampaign, 120),
      utmContent: s(attr.utmContent, 120),
      utmTerm: s(attr.utmTerm, 120),
      gclid: s(attr.gclid),
      fbclid: s(attr.fbclid),
      channel,
      landingPage,
    }

    // ---------- CHECKOUT DE TRILHA ----------
    if (trackId) {
      const track = await db.track.findUnique({
        where: { id: trackId },
        include: {
          mentor: { include: { user: true } },
          items: { where: { type: 'COURSE' }, select: { courseId: true } },
        },
      })
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
      if (!track || !track.isPublished) {
        return NextResponse.json({ error: 'Trilha não encontrada.' }, { status: 404 })
      }

      const existingTrackEnrollment = await db.trackEnrollment.findUnique({
        where: { trackId_studentId: { trackId, studentId: userId } },
      })
      if (existingTrackEnrollment) {
        return NextResponse.json({ error: 'Você já tem acesso a esta trilha.' }, { status: 409 })
      }

      const courseIds = track.items
        .filter((i): i is { courseId: string } => Boolean(i.courseId))
        .map((i) => i.courseId)

      const [, order] = await db.$transaction([
        db.trackEnrollment.create({ data: { trackId, studentId: userId } }),
        db.order.create({
          data: {
            trackId,
            studentId: userId,
            mentorId: track.mentorId,
            amount: track.price,
            paymentMethod,
            status: 'PAID',
            ...attributionFields,
          },
        }),
        db.trackingEvent.create({
          data: {
            name: 'purchase',
            mentorId: track.mentorId,
            userId,
            valueCents: Math.round(track.price * 100),
            utmSource: attributionFields.utmSource,
            utmMedium: attributionFields.utmMedium,
            utmCampaign: attributionFields.utmCampaign,
            utmContent: attributionFields.utmContent,
            utmTerm: attributionFields.utmTerm,
            gclid: attributionFields.gclid,
            fbclid: attributionFields.fbclid,
            channel,
            path: s(body?.path, 300),
          },
        }),
      ])

      // Matricula em todos os cursos da trilha que ainda não frequentava
      for (const cid of courseIds) {
        await db.enrollment.upsert({
          where: { courseId_studentId: { courseId: cid, studentId: userId } },
          create: { courseId: cid, studentId: userId, completedLessonIds: '[]' },
          update: {},
        })
      }

      return NextResponse.json({
        order: {
          id: order.id,
          itemKind: 'TRACK',
          itemTitle: track.title,
          amount: order.amount,
          paymentMethod: order.paymentMethod,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
        },
        alreadyEnrolled: false,
      })
    }

    // ---------- CHECKOUT DE CURSO ----------
    const [user, course] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.course.findUnique({
        where: { id: courseId },
        include: { mentor: { include: { user: true } } },
      }),
    ])

    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    if (!course || !course.isPublished) {
      return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    }

    const existing = await db.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId: userId } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Você já tem acesso a este curso.' },
        { status: 409 }
      )
    }

    // Pedido + matrícula + evento de conversão (fonte confiável no servidor)
    const [order] = await db.$transaction([
      db.order.create({
        data: {
          courseId,
          studentId: userId,
          mentorId: course.mentorId,
          amount: course.price,
          paymentMethod,
          status: 'PAID',
          ...attributionFields,
        },
      }),
      db.enrollment.create({
        data: { courseId, studentId: userId, completedLessonIds: '[]' },
      }),
      db.trackingEvent.create({
        data: {
          name: 'purchase',
          mentorId: course.mentorId,
          courseId,
          userId,
          valueCents: Math.round(course.price * 100),
          utmSource: attributionFields.utmSource,
          utmMedium: attributionFields.utmMedium,
          utmCampaign: attributionFields.utmCampaign,
          utmContent: attributionFields.utmContent,
          utmTerm: attributionFields.utmTerm,
          gclid: attributionFields.gclid,
          fbclid: attributionFields.fbclid,
          channel,
          path: s(body?.path, 300),
        },
      }),
    ])

    return NextResponse.json({
      order: {
        id: order.id,
        itemKind: 'COURSE',
        itemTitle: course.title,
        amount: order.amount,
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      },
      alreadyEnrolled: false,
    })
  } catch (err) {
    console.error('POST /api/checkout', err)
    return NextResponse.json({ error: 'Erro ao processar o checkout.' }, { status: 500 })
  }
}
