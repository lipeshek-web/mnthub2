import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bundleBaseInclude, serializeBundle, serializeBundleDetail } from '@/lib/bundle-serialize'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** GET /api/bundles/[id]?userId= — detalhe do pacote (checkout) */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()

    const bundle = await db.bundle.findUnique({
      where: { id },
      include: bundleBaseInclude(),
    })
    if (!bundle || (!bundle.isPublished && !userId)) {
      return NextResponse.json({ error: 'Pacote não encontrado.' }, { status: 404 })
    }

    if (!userId) return NextResponse.json({ bundle: serializeBundle(bundle) })

    const enrolled = await db.enrollment.findMany({
      where: { studentId: userId, courseId: { in: bundle.items.map((i) => i.courseId) } },
      select: { courseId: true },
    })
    return NextResponse.json({
      bundle: serializeBundleDetail(bundle, enrolled.map((e) => e.courseId)),
    })
  } catch (err) {
    console.error('GET /api/bundles/[id]', err)
    return NextResponse.json({ error: 'Erro ao carregar o pacote.' }, { status: 500 })
  }
}

/** DELETE /api/bundles/[id] — remove pacote do próprio mentor da SESSÃO */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    // Sessão em vez de userId da query — excluir pacote de outro mentor (IDOR)
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente.')
    const { id } = await ctx.params
    const userId = session.id

    const profile = await db.mentorProfile.findUnique({ where: { userId } })
    if (!profile) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 403 })

    const bundle = await db.bundle.findUnique({ where: { id } })
    if (!bundle || bundle.mentorId !== profile.id) {
      return NextResponse.json({ error: 'Pacote não encontrado.' }, { status: 404 })
    }

    await db.bundle.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/bundles/[id]', err)
    return NextResponse.json({ error: 'Erro ao excluir o pacote.' }, { status: 500 })
  }
}
