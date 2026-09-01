import { createServer } from 'http'
import { Server, type Socket } from 'socket.io'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * MentorHub Meeting Service — sinalização WebRTC 1:1 para sessões de mentoria.
 *
 * A identidade e o PAPEL (anfitrião = mentor) NUNCA vêm do cliente: o cliente
 * apresenta um token HMAC assinado pela API Next.js (que valida a sessão e a
 * participação no booking). Aqui só verificamos a assinatura e controlamos a
 * presença (2 participantes por sala, reconexão substitui o socket antigo).
 */

const PORT = 3004
const SECRET = process.env.MEETING_SECRET || 'mentorhub-meeting-dev-secret'

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
})

type Role = 'HOST' | 'GUEST'

interface TokenPayload {
  /** bookingId = sala */
  r: string
  /** userId */
  u: string
  /** nome de exibição */
  n: string
  /** role HOST|GUEST */
  ro: Role
  /** expiração (epoch ms) */
  e: number
}

function b64url(buf: Buffer): string {
  return buf.toString('base64url')
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const [payload, sig] = String(token).split('.')
    if (!payload || !sig) return null
    const expected = createHmac('sha256', SECRET).update(payload).digest('base64url')
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenPayload
    if (!data.r || !data.u || !data.ro || typeof data.e !== 'number') return null
    if (Date.now() > data.e) return null
    return data
  } catch {
    return null
  }
}

/** sala → (userId → socketId) */
const rooms = new Map<string, Map<string, string>>()

function roomOf(bookingId: string): Map<string, string> {
  let m = rooms.get(bookingId)
  if (!m) {
    m = new Map()
    rooms.set(bookingId, m)
  }
  return m
}

function peersOf(bookingId: string): number {
  return rooms.get(bookingId)?.size ?? 0
}

function leaveRoom(socket: Socket) {
  const d = socket.data as { room?: string; uid?: string; name?: string; role?: Role }
  if (!d.room || !d.uid) return
  const map = rooms.get(d.room)
  if (!map) return
  // Só remove se este socket ainda for o dono do assento (reconexão já o substituiu)
  if (map.get(d.uid) === socket.id) {
    map.delete(d.uid)
    if (map.size === 0) rooms.delete(d.room)
    socket.to(d.room).emit('peer-left', { name: d.name })
  }
}

io.on('connection', (socket) => {
  socket.on('join', (raw: { token?: unknown }) => {
    const payload = verifyToken(String(raw?.token ?? ''))
    if (!payload) {
      socket.emit('meeting-error', {
        code: 'invalid-token',
        message: 'Sessão da sala inválida ou expirada. Recarregue a página.',
      })
      return
    }

    const { r: room, u: uid, n: name, ro: role } = payload
    const map = roomOf(room)
    const existing = map.get(uid)

    // Reconexão (refresh/queda de rede): o mesmo usuário volta e substitui o
    // socket antigo — nunca deve perder o assento para "sala cheia".
    if (existing && existing !== socket.id) {
      io.in(existing).disconnectSockets(true)
    }

    if (!existing && map.size >= 2) {
      socket.emit('meeting-error', {
        code: 'room-full',
        message: 'Esta sala já está ocupada pela sessão 1:1 (mentor + mentorado).',
      })
      return
    }

    map.set(uid, socket.id)
    socket.data = { room, uid, name, role }
    void socket.join(room)

    const peerSeat = [...map.entries()].find(([id]) => id !== uid)
    socket.emit('joined', {
      role,
      name,
      room,
      peerOnline: Boolean(peerSeat),
    })
    if (peerSeat) {
      // avisa quem já estava
      socket.to(room).emit('peer-joined', { name, role })
    }
    console.log(`[meeting] ${name} (${role}) entrou na sala ${room} — ${peersOf(room)} online`)
  })

  // Relay de sinalização WebRTC (offer/answer/candidates) — só para o par da sala
  socket.on('signal', (raw: { kind?: unknown; data?: unknown }) => {
    const d = socket.data as { room?: string }
    if (!d.room || (raw?.kind !== 'desc' && raw?.kind !== 'cand')) return
    socket.to(d.room).emit('signal', { kind: raw.kind, data: raw.data })
  })

  // Estado de mídia (mic/câmera/tela) para exibir badges no tile do par
  socket.on('media-state', (raw: { audio?: unknown; video?: unknown; screen?: unknown }) => {
    const d = socket.data as { room?: string }
    if (!d.room) return
    socket.to(d.room).emit('media-state', {
      audio: Boolean(raw?.audio),
      video: Boolean(raw?.video),
      screen: Boolean(raw?.screen),
    })
  })

  socket.on('leave', () => {
    leaveRoom(socket)
    socket.disconnect(true)
  })

  socket.on('disconnect', () => {
    leaveRoom(socket)
  })

  socket.on('error', (e) => {
    console.error('[meeting] socket error', e)
  })
})

httpServer.listen(PORT, () => {
  console.log(`MentorHub Meeting Service (WebRTC signaling) on port ${PORT}`)
})

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  httpServer.close(() => process.exit(0))
})
