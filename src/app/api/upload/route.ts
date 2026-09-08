import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

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
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_DOC_BYTES = 20 * 1024 * 1024 // 20MB

/**
 * POST /api/upload — upload de imagem (avatar/capas) ou documento/anexo/mídia
 * (PDF, áudio, vídeo) → { url, name, kind }.
 *
 * PERSISTÊNCIA À PROVA DE PERDA: o arquivo é gravado no PRÓPRIO BANCO
 * (modelo UploadFile) — em modo nuvem vive no TURSO e sobrevive a publish,
 * rebuild e downgrade de snapshot (arquivos no filesystem morriam no rebuild).
 * A URL devolvida é /api/files/<id>, servida pelo app com cache imutável.
 *
 * Exige sessão (era aberto — vetor de abuso).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await resolveUser(req)
    if (!session) return unauthorized('Entre para enviar arquivos.')

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
            'Formato não suportado. Imagens: JPG/PNG/WEBP/GIF · Documentos: PDF/ZIP/DOC(X)/PPT(X)/XLS(X)/TXT/CSV/MP3/M4A/WAV/OGG/MP4/WEBM.',
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

    const safeName =
      file.name
        .replace(/[^\p{L}\p{N}\-_. ()]+/gu, '')
        .replace(/\.[^.]+$/, '')
        .slice(0, 120) || 'Anexo'

    const buffer = Buffer.from(await file.arrayBuffer())
    const created = await db.uploadFile.create({
      data: {
        name: `${safeName}.${ext}`,
        mime: file.type || 'application/octet-stream',
        size: buffer.length,
        data: buffer,
      },
    })

    return NextResponse.json({
      url: `/api/files/${created.id}`,
      name: safeName,
      kind: isImage ? 'image' : 'document',
    })
  } catch (err) {
    console.error('POST /api/upload', err)
    return NextResponse.json({ error: 'Falha no upload do arquivo.' }, { status: 500 })
  }
}
