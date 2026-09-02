import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { absolutize, getOrigin, v1Error, v1Json } from '@/lib/api-v1'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/messages/threads — caixa de entrada do aluno autenticado
 * (JWT Bearer): uma linha por conversa com última mensagem, data e contagem
 * de não lidas. Espelho do /api/messages/threads do site.
 */
export async function GET(req: NextRequest) {
  const user = await requireMobileUser(req)
  if (!user) return v1Error('Sessão expirada. Faça login novamente.', 401)

  try {
    const userId = user.id
    const messages = await db.directMessage.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    // Agrupa por par (o "outro" de cada mensagem)
    const byPeer = new Map<
      string,
      { lastBody: string; lastAt: string; lastMine: boolean; unread: number }
    >()
    for (const m of messages) {
      const peer = m.senderId === userId ? m.recipientId : m.senderId
      const entry = byPeer.get(peer)
      const mine = m.senderId === userId
      if (!entry) {
        byPeer.set(peer, {
          lastBody: m.body,
          lastAt: m.createdAt.toISOString(),
          lastMine: mine,
          unread: !mine && !m.readAt ? 1 : 0,
        })
      } else if (!mine && !m.readAt) {
        entry.unread += 1
      }
    }

    const peerIds = [...byPeer.keys()]
    const users = await db.user.findMany({
      where: { id: { in: peerIds } },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        mentorProfile: { select: { id: true } },
      },
    })
    const usersById = new Map(users.map((u) => [u.id, u]))
    const origin = getOrigin(req)

    const threads = peerIds
      .map((peerId) => {
        const u = usersById.get(peerId)
        const agg = byPeer.get(peerId)
        if (!u || !agg) return null
        return {
          peer: {
            id: u.id,
            name: u.name,
            avatarUrl: absolutize(u.avatarUrl, origin),
            isMentor: Boolean(u.mentorProfile),
          },
          lastBody: agg.lastBody,
          lastAt: agg.lastAt,
          lastMine: agg.lastMine,
          unread: agg.unread,
        }
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1))

    const unreadTotal = threads.reduce((sum, t) => sum + t.unread, 0)
    return v1Json({ unreadTotal, threads })
  } catch (err) {
    console.error('GET /api/v1/messages/threads', err)
    return v1Error('Erro ao carregar conversas.', 500)
  }
}
