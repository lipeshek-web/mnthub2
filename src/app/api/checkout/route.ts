import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/checkout — finaliza a compra de um curso pago (checkout demonstrativo):
 * cria o pedido + matrícula + evento de conversão (purchase) com atribuição,
 * para alimentar o funil e os relatórios de tráfego pago do mentor.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = String(body?.userId ?? '')
    const courseId = String(body?.courseId ?? '')
    const paymentMethod = body?.paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX'

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'Dados incompletos para o checkout.' }, { status: 400 })
    }

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

    const attr = (body?.attribution ?? {}) as Record<string, unknown>
    const s = (v: unknown, max = 190) => {
      const str = String(v ?? '').trim()
      return str ? str.slice(0, max) : null
    }
    const channel = s(attr.channel, 40) || 'direct'
    const landingPage = attr.landingPage === 'mentor_lp' ? 'mentor_lp' : 'platform'

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
          utmSource: s(attr.utmSource),
          utmMedium: s(attr.utmMedium),
          utmCampaign: s(attr.utmCampaign, 120),
          utmContent: s(attr.utmContent, 120),
          utmTerm: s(attr.utmTerm, 120),
          gclid: s(attr.gclid),
          fbclid: s(attr.fbclid),
          channel,
          landingPage,
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
          utmSource: s(attr.utmSource),
          utmMedium: s(attr.utmMedium),
          utmCampaign: s(attr.utmCampaign, 120),
          utmContent: s(attr.utmContent, 120),
          utmTerm: s(attr.utmTerm, 120),
          gclid: s(attr.gclid),
          fbclid: s(attr.fbclid),
          channel,
          path: s(body?.path, 300),
        },
      }),
    ])

    return NextResponse.json({
      order: {
        id: order.id,
        courseId,
        courseTitle: course.title,
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
