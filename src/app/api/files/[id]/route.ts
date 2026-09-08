import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/files/[id] — serve um arquivo gravado no banco (modelo UploadFile).
 * Cache imutável: o conteúdo é imutável por id (upload cria NOVA linha/novo id),
 * então o navegador pode guardar para sempre — leituras repetidas não custam
 * rede ao Turso.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const file = await db.uploadFile.findUnique({
      where: { id },
      select: { name: true, mime: true, size: true, data: true },
    })
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 })
    }

    const body = Buffer.from(file.data as unknown as Uint8Array)
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        'Content-Type': file.mime || 'application/octet-stream',
        'Content-Length': String(body.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`,
      },
    })
  } catch (err) {
    console.error('GET /api/files/[id]', err)
    return NextResponse.json({ error: 'Falha ao carregar o arquivo.' }, { status: 500 })
  }
}
