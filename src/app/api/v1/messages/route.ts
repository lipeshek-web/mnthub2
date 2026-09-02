import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { notify } from '@/lib/notify'
import { requireMobileUser } from '@/lib/mobile-auth'
import { absolutize, getOrigin, v1Error, v1Json } from '@/lib/api-v1'

export const dynamic = 'force-dynamic'

const MAX_BODY = 2000

/** Resumo público do par (nome, avatar, headline do mentor quando houver) */
async function peerInfo(peerId: string, origin: string) {
  const u = await db.user.findUnique({
    where: { id: peerId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      mentorProfile: { select: { headline: true } },
    },
  })
  if (!u) return null
  return {
    id: u.id,
    name: u.name,
    avatarUrl: absolutize(u.avatarUrl, origin),
    isMentor: Boolean(u.mentorProfile),
    headline: u.mentorProfile?.headline ?? null,
  }
}

/**
 * GET /api/v1/messages?peerId= — conversa do aluno autenticado com o par
 * (mais antigas primeiro, últimas 200). Abrir a thread marca como lidas as
 * mensagens recebidas do par.
 */
export async function GET(req: NextRequest) {
  const user = await requireMobileUser(req)
  if (!user) return v1Error('Sessão expirada. Faça login novamente.', 401)

  try {
    const userId = user.id
    const peerId = (req.nextUrl.searchParams.get('peerId') || '').trim()
    if (!peerId || userId === peerId) {
      return v1Error('Participantes inválidos.', 400)
    }

    const [items, peer] = await Promise.all([
      db.directMessage.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: peerId },
            { senderId: peerId, recipientId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      peerInfo(peerId, getOrigin(req)),
    ])
    if (!peer) return v1Error('Usuário não encontrado.', 404)

    // Marca como lidas as mensagens que eu RECEBI do par
    const unreadIds = items.filter((m) => m.recipientId === userId && !m.readAt).map((m) => m.id)
    if (unreadIds.length > 0) {
      await db.directMessage.updateMany({
        where: { id: { in: unreadIds } },
        data: { readAt: new Date() },
      })
    }

    return v1Json({
      peer,
      items: items
        .reverse()
        .map((m) => ({
          id: m.id,
          body: m.body,
          mine: m.senderId === userId,
          read: Boolean(m.readAt) || m.recipientId !== userId,
          createdAt: m.createdAt.toISOString(),
        })),
    })
  } catch (err) {
    console.error('GET /api/v1/messages', err)
    return v1Error('Erro ao carregar mensagens.', 500)
  }
}

/** POST /api/v1/messages — body: { peerId (destinatário), body } */
export async function POST(req: NextRequest) {
  const user = await requireMobileUser(req)
  if (!user) return v1Error('Sessão expirada. Faça login novamente.', 401)

  try {
    const payload = await req.json().catch(() => ({}))
    const userId = user.id
    const peerId = String(payload?.peerId ?? '').trim()
    const text = String(payload?.body ?? '').trim()
    if (!peerId || userId === peerId) {
      return v1Error('Participantes inválidos.', 400)
    }
    if (!text) return v1Error('Mensagem vazia.', 400)
    if (text.length > MAX_BODY) return v1Error('Mensagem muito longa (máx. 2000 caracteres).', 400)

    const peer = await peerInfo(peerId, getOrigin(req))
    if (!peer) return v1Error('Usuário não encontrado.', 404)

    const msg = await db.directMessage.create({
      data: { senderId: userId, recipientId: peerId, body: text },
    })

    // Notificação in-app no destinatário (sino + badge de mensagens)
    await notify({
      userId: peerId,
      kind: 'message_new',
      title: 'Nova mensagem 💬',
      body: text.slice(0, 120),
      linkView: 'messages',
      refId: userId,
    })

    return v1Json({
      id: msg.id,
      body: msg.body,
      mine: true,
      read: false,
      createdAt: msg.createdAt.toISOString(),
    })
  } catch (err) {
    console.error('POST /api/v1/messages', err)
    return v1Error('Erro ao enviar mensagem.', 500)
  }
}
