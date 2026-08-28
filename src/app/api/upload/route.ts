import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const MAX_BYTES = 5 * 1024 * 1024 // 5MB

/** POST /api/upload — upload de imagem (avatar, capa, capa de curso) → { url } */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 })
    }
    const ext = ALLOWED[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: 'Formato não suportado. Use JPG, PNG, WEBP ou GIF.' },
        { status: 415 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Imagem muito grande (máx. 5MB).' }, { status: 413 })
    }

    const dir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(dir, { recursive: true })
    const filename = `${randomUUID()}.${ext}`
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))

    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (err) {
    console.error('POST /api/upload', err)
    return NextResponse.json({ error: 'Falha no upload da imagem.' }, { status: 500 })
  }
}
