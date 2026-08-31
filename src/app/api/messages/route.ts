import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notify } from '@/lib/notify'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

const MAX_BODY = 2000

/** Resumo público do par (nome, avatar, headline do mentor quando houver) */
async function peerInfo(peerId: string) {
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
    avatarUrl: u.avatarUrl,
    isMentor: Boolean(u.mentorProfile),
    headline: u.mentorProfile?.headline ?? null,
  }
}

/**
 * GET /api/messages?peerId= — thread do usuário autenticado com o par (mais
 * antigas primeiro, carrega as últimas 200). Abrir a thread marca como lidas
 * as mensagens recebidas do par. Identidade da SESSÃO.
 */
export async function GET(req: NextRequest) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  try {
    const userId = session.id
    const peerId = (req.nextUrl.searchParams.get('peerId') || '').trim()
    if (!peerId || userId === peerId) {
      return NextResponse.json({ error: 'Participantes inválidos.' }, { status: 400 })
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
      peerInfo(peerId),
    ])
    if (!peer) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    // Marca como lidas as mensagens que eu RECEBI do par
    const unreadIds = items.filter((m) => m.recipientId === userId && !m.readAt).map((m) => m.id)
    if (unreadIds.length > 0) {
      await db.directMessage.updateMany({
        where: { id: { in: unreadIds } },
        data: { readAt: new Date() },
      })
    }

    return NextResponse.json({
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
    console.error('GET /api/messages', err)
    return NextResponse.json({ error: 'Erro ao carregar mensagens' }, { status: 500 })
  }
}

/**
 * POST /api/messages — envia uma mensagem direta.
 * body: { peerId (destinatário), body } — remetente é o usuário da SESSÃO.
 */
export async function POST(req: NextRequest) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  try {
    const payload = await req.json().catch(() => ({}))
    const userId = session.id
    const peerId = String(payload?.peerId ?? '').trim()
    const text = String(payload?.body ?? '').trim()
    if (!peerId || userId === peerId) {
      return NextResponse.json({ error: 'Participantes inválidos.' }, { status: 400 })
    }
    if (!text) return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })

    const peer = await peerInfo(peerId)
    if (!peer) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    const msg = await db.directMessage.create({
      data: { senderId: userId, recipientId: peerId, body: text.slice(0, MAX_BODY) },
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

    return NextResponse.json({
      id: msg.id,
      body: msg.body,
      mine: true,
      read: false,
      createdAt: msg.createdAt.toISOString(),
    })
  } catch (err) {
    console.error('POST /api/messages', err)
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
