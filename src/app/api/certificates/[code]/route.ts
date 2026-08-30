import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/certificates/[code] — verificação pública do certificado (sem login).
 * Retorna os dados exibidos na página do certificado.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params
    const normalized = decodeURIComponent(code || '').trim().toUpperCase()

    const cert = await db.certificate.findUnique({
      where: { code: normalized },
      include: {
        student: { select: { name: true } },
        course: {
          select: {
            title: true,
            category: true,
            lessons: { select: { durationMin: true } },
            mentor: {
              select: { headline: true, user: { select: { name: true } } },
            },
          },
        },
      },
    })

    if (!cert) {
      return NextResponse.json({ error: 'Certificado não encontrado.' }, { status: 404 })
    }

    const totalMin = cert.course.lessons.reduce((acc, l) => acc + l.durationMin, 0)

    return NextResponse.json({
      code: cert.code,
      studentName: cert.student.name,
      courseTitle: cert.course.title,
      category: cert.course.category,
      mentorName: cert.course.mentor.user.name,
      mentorHeadline: cert.course.mentor.headline,
      totalMin,
      issuedAt: cert.issuedAt.toISOString(),
    })
  } catch (err) {
    console.error('GET /api/certificates/[code]', err)
    return NextResponse.json({ error: 'Erro ao verificar certificado' }, { status: 500 })
  }
}
