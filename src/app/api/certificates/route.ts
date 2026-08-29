import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/certificates — emite (ou retorna) o certificado de conclusão do curso.
 * body: { courseId, userId }
 * Exige inscrição com 100% das aulas concluídas. O código é único e verificável.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const courseId = String(body?.courseId ?? '').trim()
    const userId = String(body?.userId ?? '').trim()
    if (!courseId || !userId) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { mentor: { include: { user: true } } },
    })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })

    const enrollment = await db.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId: userId } },
    })
    if (!enrollment) {
      return NextResponse.json({ error: 'Você precisa estar inscrito no curso.' }, { status: 403 })
    }

    // Conclusão: marcada quando atinge 100% (completedAt) — fallback: conta as aulas
    let completed = false
    if (enrollment.completedAt) {
      completed = true
    } else {
      let ids: string[] = []
      try {
        const parsed = JSON.parse(enrollment.completedLessonIds || '[]')
        if (Array.isArray(parsed)) ids = parsed.map(String)
      } catch {
        ids = []
      }
      const total = await db.lesson.count({ where: { courseId } })
      completed = total > 0 && ids.length >= total
    }
    if (!completed) {
      return NextResponse.json(
        { error: 'Conclua todas as aulas para emitir o certificado.' },
        { status: 403 }
      )
    }

    const existing = await db.certificate.findUnique({
      where: { courseId_studentId: { courseId, studentId: userId } },
    })
    if (existing) {
      return NextResponse.json({ code: existing.code, issuedAt: existing.issuedAt.toISOString() })
    }

    const code = `MH-${randomBytes(6).toString('hex').toUpperCase().slice(0, 10)}`
    const cert = await db.certificate.create({
      data: { code, courseId, studentId: userId },
    })

    return NextResponse.json({ code: cert.code, issuedAt: cert.issuedAt.toISOString() }, { status: 201 })
  } catch (err) {
    console.error('POST /api/certificates', err)
    return NextResponse.json({ error: 'Erro ao emitir certificado' }, { status: 500 })
  }
}
