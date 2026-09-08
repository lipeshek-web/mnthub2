import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const DOC_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'video/mp4': 'mp4',
}
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_DOC_BYTES = 20 * 1024 * 1024 // 20MB

/** POST /api/upload — upload de imagem (avatar/capas) ou documento (anexo de aula) → { url, name } */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    const imageExt = IMAGE_TYPES[file.type]
    const docExt = DOC_TYPES[file.type]
    const ext = imageExt ?? docExt
    if (!ext) {
      return NextResponse.json(
        {
          error:
            'Formato não suportado. Imagens: JPG/PNG/WEBP/GIF · Documentos: PDF/ZIP/DOC(X)/PPT(X)/XLS(X)/TXT/CSV/MP3/MP4.',
        },
        { status: 415 }
      )
    }
    const isImage = Boolean(imageExt)
    const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_DOC_BYTES
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `Arquivo muito grande (máx. ${isImage ? '5MB' : '20MB'}).` },
        { status: 413 }
      )
    }

    const dir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(dir, { recursive: true })
    const filename = `${randomUUID()}.${ext}`
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))

    return NextResponse.json({
      url: `/uploads/${filename}`,
      name: file.name.replace(/\.[^.]+$/, '').slice(0, 120) || 'Anexo',
      kind: isImage ? 'image' : 'document',
    })
  } catch (err) {
    console.error('POST /api/upload', err)
    return NextResponse.json({ error: 'Falha no upload do arquivo.' }, { status: 500 })
  }
}
