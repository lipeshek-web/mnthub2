import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/** Valida o cupom do mentor para o item informado; retorna dados para o pedido */
async function resolveCoupon(rawCode: string, mentorId: string, price: number) {
  const code = rawCode.trim().toUpperCase()
  if (!code) return { error: null as string | null, coupon: null, discount: 0 }
  const coupon = await db.coupon.findUnique({
    where: { mentorId_code: { mentorId, code } },
  })
  if (!coupon || coupon.mentorId !== mentorId) {
    return { error: 'Cupom inválido.', coupon: null, discount: 0 }
  }
  if (!coupon.isActive) return { error: 'Este cupom está desativado.', coupon: null, discount: 0 }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { error: 'Este cupom expirou.', coupon: null, discount: 0 }
  }
  if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) {
    return { error: 'Este cupom esgotou o número de usos.', coupon: null, discount: 0 }
  }
  let discount = 0
  if (coupon.percentOff !== null) {
    discount = Math.round(price * (coupon.percentOff / 100) * 100) / 100
  } else if (coupon.amountOff !== null) {
    discount = Math.min(coupon.amountOff, price)
  }
  return { error: null, coupon, discount }
}

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
    const couponCode = String(body?.couponCode ?? '').trim()

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

      // Cupom (do mentor da trilha)
      const { error: couponError, coupon, discount } = await resolveCoupon(couponCode, track.mentorId, track.price)
      if (couponError) return NextResponse.json({ error: couponError }, { status: 400 })
      const finalAmount = Math.max(0, Math.round((track.price - discount) * 100) / 100)

      const [, order] = await db.$transaction([
        db.trackEnrollment.create({ data: { trackId, studentId: userId } }),
        db.order.create({
          data: {
            trackId,
            studentId: userId,
            mentorId: track.mentorId,
            amount: finalAmount,
            paymentMethod,
            status: 'PAID',
            couponCode: coupon ? coupon.code : null,
            discount,
            ...attributionFields,
          },
        }),
        db.trackingEvent.create({
          data: {
            name: 'purchase',
            mentorId: track.mentorId,
            userId,
            valueCents: Math.round(finalAmount * 100),
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

      // Consome o cupom e notifica o mentor sobre a venda
      if (coupon) {
        await db.coupon.update({ where: { id: coupon.id }, data: { uses: { increment: 1 } } })
      }
      await notify({
        userId: track.mentor.userId,
        kind: 'purchase_new',
        title: `Nova venda: "${track.title}" 🤑`,
        body: `${user.name} comprou a trilha${coupon ? ` (cupom ${coupon.code})` : ''}.`,
        linkView: 'onboarding',
        refId: track.id,
      })

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

    // Cupom (do mentor do curso)
    const { error: couponError, coupon, discount } = await resolveCoupon(couponCode, course.mentorId, course.price)
    if (couponError) return NextResponse.json({ error: couponError }, { status: 400 })
    const finalAmount = Math.max(0, Math.round((course.price - discount) * 100) / 100)

    // Pedido + matrícula + evento de conversão (fonte confiável no servidor)
    const [order] = await db.$transaction([
      db.order.create({
        data: {
          courseId,
          studentId: userId,
          mentorId: course.mentorId,
          amount: finalAmount,
          paymentMethod,
          status: 'PAID',
          couponCode: coupon ? coupon.code : null,
          discount,
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
          valueCents: Math.round(finalAmount * 100),
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

    // Consome o cupom e notifica o mentor sobre a venda
    if (coupon) {
      await db.coupon.update({ where: { id: coupon.id }, data: { uses: { increment: 1 } } })
    }
    await notify({
      userId: course.mentor.userId,
      kind: 'purchase_new',
      title: `Nova venda: "${course.title}" 🤑`,
      body: `${user.name} comprou o curso${coupon ? ` (cupom ${coupon.code})` : ''}.`,
      linkView: 'onboarding',
      refId: course.id,
    })

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
