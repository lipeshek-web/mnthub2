import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/messages/threads?userId= — caixa de entrada: uma linha por par de
 * conversa com última mensagem, data e contagem de não lidas.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

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
      } else {
        if (!mine && !m.readAt) entry.unread += 1
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

    const threads = peerIds
      .map((peerId) => {
        const u = usersById.get(peerId)
        const agg = byPeer.get(peerId)!
        if (!u) return null
        return {
          peer: { id: u.id, name: u.name, avatarUrl: u.avatarUrl, isMentor: Boolean(u.mentorProfile) },
          lastBody: agg.lastBody,
          lastAt: agg.lastAt,
          lastMine: agg.lastMine,
          unread: agg.unread,
        }
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1))

    const unreadTotal = threads.reduce((sum, t) => sum + t.unread, 0)
    return NextResponse.json({ unreadTotal, threads })
  } catch (err) {
    console.error('GET /api/messages/threads', err)
    return NextResponse.json({ error: 'Erro ao carregar conversas' }, { status: 500 })
  }
}
