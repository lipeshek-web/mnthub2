import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/messages/threads — caixa de entrada do usuário autenticado: uma
 * linha por par de conversa com última mensagem, data e contagem de não lidas.
 * Identidade da SESSÃO (antes vinha da query e permitia ler a caixa de
 * entrada de qualquer pessoa).
 *
 * A agregação roda em SQL (window function): a última mensagem por par e os
 * não lidos saem direto do banco — sem teto artificial de mensagens (o recorte
 * antigo em 500 fazia conversas antigas sumirem para quem tem muito histórico)
 * e sem carregar todo o histórico no processo Node.
 */
export async function GET(req: NextRequest) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()

  try {
    const userId = session.id

    // Última mensagem por par (a conversa é sempre "eu ↔ outro")
    const lastMessages = await db.$queryRaw<
      { senderId: string; recipientId: string; body: string; readAt: Date | null; createdAt: Date }[]
    >`
      SELECT senderId, recipientId, body, readAt, createdAt
      FROM (
        SELECT m.*,
               ROW_NUMBER() OVER (
                 PARTITION BY CASE WHEN m.senderId = ${userId} THEN m.recipientId ELSE m.senderId END
                 ORDER BY m.createdAt DESC, m.id DESC
               ) AS rn
        FROM DirectMessage m
        WHERE m.senderId = ${userId} OR m.recipientId = ${userId}
      ) ranked
      WHERE rn = 1
    `

    // Não lidas por par (mensagens recebidas e ainda não lidas)
    const unreadRows = await db.$queryRaw<{ peerId: string; unread: bigint }[]>`
      SELECT CASE WHEN senderId = ${userId} THEN recipientId ELSE senderId END AS peerId,
             COUNT(*) AS unread
      FROM DirectMessage
      WHERE (senderId = ${userId} OR recipientId = ${userId})
        AND senderId <> ${userId}
        AND readAt IS NULL
      GROUP BY peerId
    `
    const unreadByPeer = new Map(unreadRows.map((r) => [r.peerId, Number(r.unread)]))

    const peerIds = lastMessages.map((m) => (m.senderId === userId ? m.recipientId : m.senderId))
    if (peerIds.length === 0) {
      return NextResponse.json({ unreadTotal: 0, threads: [] })
    }

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

    const threads = lastMessages
      .map((m) => {
        const mine = m.senderId === userId
        const peerId = mine ? m.recipientId : m.senderId
        const u = usersById.get(peerId)
        if (!u) return null
        return {
          peer: { id: u.id, name: u.name, avatarUrl: u.avatarUrl, isMentor: Boolean(u.mentorProfile) },
          lastBody: m.body,
          lastAt: new Date(m.createdAt).toISOString(),
          lastMine: mine,
          unread: unreadByPeer.get(peerId) ?? 0,
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
