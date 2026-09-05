import { createServer } from 'http'
import { Server, type Socket } from 'socket.io'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * MentorHub Meeting Service — sinalização WebRTC para salas da plataforma.
 *
 * Dois modos, decididos PELO TOKEN assinado pela API (o cliente nunca se
 * autodeclara):
 *
 *  1. LEGADO 1:1 (sessões de mentoria): token SEM capacidade (`c` ausente) →
 *     sala com 2 assentos e sinalização em broadcast (só há um par, então
 *     "todo mundo menos eu" == "meu par"). Mantém 100% o contrato que o
 *     live.html e o meeting-room.tsx já usam.
 *
 *  2. MALHA (eventos/reuniões multi-participante): token COM `c` (2..12) →
 *     sala com N assentos. A sinalização vira PONTO A PONTO (`to`/`from` com
 *     o userId) e o recém-chegado inicia as ofertas para quem já está na sala.
 *     O 'joined' devolve a lista de `peers` (uid/nome/papel) para o cliente
 *     montar a malha.
 *
 * Identidade e PAPEL (anfitrião/participante) NUNCA vêm do cliente: o cliente
 * apresenta um token HMAC assinado pela API Next.js (que valida sessão e
 * participação). Aqui só verificamos a assinatura e controlamos a presença
 * (reconexão substitui o socket antigo — nunca perde o assento).
 */

const PORT = 3004
const SECRET = process.env.MEETING_SECRET || 'mentorhub-meeting-dev-secret'
const MAX_SEATS = 12 // teto físico do modo malha (WebRTC mesh aguenta bem até ~10)

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
  /** roomId (bookingId ou `ev-<eventId>`) */
  r: string
  /** userId */
  u: string
  /** nome de exibição */
  n: string
  /** role HOST|GUEST */
  ro: Role
  /** expiração (epoch ms) */
  e: number
  /** capacidade da sala (opcional — presente = modo malha; 2..MAX_SEATS) */
  c?: number
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

/** sala → assentos (userId → socketId) + capacidade */
interface Room {
  seats: Map<string, string>
  capacity: number
  mesh: boolean
}
const rooms = new Map<string, Room>()

function roomOf(roomId: string, capacity: number, mesh: boolean): Room {
  let m = rooms.get(roomId)
  if (!m) {
    m = { seats: new Map(), capacity, mesh }
    rooms.set(roomId, m)
  }
  return m
}

function peersOf(room: Room): number {
  return room.seats.size
}

function leaveRoom(socket: Socket) {
  const d = socket.data as { room?: string; uid?: string; name?: string; role?: Role }
  if (!d.room || !d.uid) return
  const room = rooms.get(d.room)
  if (!room) return
  // Só remove se este socket ainda for o dono do assento (reconexão já o substituiu)
  if (room.seats.get(d.uid) === socket.id) {
    room.seats.delete(d.uid)
    if (room.seats.size === 0) rooms.delete(d.room)
    socket.to(d.room).emit('peer-left', { uid: d.uid, name: d.name })
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
    const mesh = typeof payload.c === 'number'
    const capacity = mesh ? Math.min(Math.max(Math.round(payload.c as number), 2), MAX_SEATS) : 2
    const rm = roomOf(room, capacity, mesh)
    const existing = rm.seats.get(uid)

    // Reconexão (refresh/queda de rede): o mesmo usuário volta e substitui o
    // socket antigo — nunca deve perder o assento para "sala cheia".
    if (existing && existing !== socket.id) {
      io.in(existing).disconnectSockets(true)
    }

    if (!existing && peersOf(rm) >= rm.capacity) {
      socket.emit('meeting-error', {
        code: 'room-full',
        message:
          rm.capacity <= 2
            ? 'Esta sala já está ocupada pela sessão 1:1 (mentor + mentorado).'
            : `A sala atingiu a capacidade de ${rm.capacity} participantes.`,
      })
      return
    }

    rm.seats.set(uid, socket.id)
    socket.data = { room, uid, name, role }
    void socket.join(room)

    // Lista dos outros assentos (para o cliente montar a malha; no 1:1 vira
    // no máximo 1 par — campo extra que os clientes legados simplesmente ignoram)
    const peers = [...rm.seats.entries()]
      .filter(([id]) => id !== uid)
      .map(([id]) => {
        const meta = (io.sockets.sockets.get(rm.seats.get(id)!)?.data ?? {}) as {
          name?: string
          role?: Role
        }
        return { uid: id, name: meta.name || id, role: meta.role || 'GUEST' }
      })

    socket.emit('joined', {
      role,
      name,
      room,
      capacity: rm.capacity,
      mesh: rm.mesh,
      peers,
      // legado (1:1):
      peerOnline: peers.length > 0,
    })
    if (peers.length > 0) {
      // avisa quem já estava
      socket.to(room).emit('peer-joined', { uid, name, role })
    }
    console.log(
      `[meeting] ${name} (${role}) entrou na sala ${room} — ${peersOf(rm)}/${rm.capacity} online${rm.mesh ? ' [malha]' : ''}`
    )
  })

  // Relay de sinalização WebRTC (offer/answer/candidates).
  //  - Malha: o cliente endereça com `to` (userId) → entregamos só ao assento e
  //    carimbamos `from` para o destinatário saber de quem veio.
  //  - Legado: sem `to` → broadcast para a sala (2 pessoas = só o par recebe).
  socket.on('signal', (raw: { kind?: unknown; data?: unknown; to?: unknown }) => {
    const d = socket.data as { room?: string; uid?: string }
    if (!d.room || !d.uid) return
    if (raw?.kind !== 'desc' && raw?.kind !== 'cand') return
    const envelope = { kind: raw.kind, data: raw.data, from: d.uid }
    const to = typeof raw.to === 'string' ? raw.to : ''
    if (to) {
      const room = rooms.get(d.room)
      const target = room?.seats.get(to)
      if (target) io.in(target).emit('signal', envelope)
    } else {
      socket.to(d.room).emit('signal', envelope)
    }
  })

  // Estado de mídia (mic/câmera/tela) para exibir badges nos tiles dos pares
  socket.on('media-state', (raw: { audio?: unknown; video?: unknown; screen?: unknown }) => {
    const d = socket.data as { room?: string; uid?: string }
    if (!d.room) return
    socket.to(d.room).emit('media-state', {
      uid: d.uid,
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
  console.log(`MentorHub Meeting Service (WebRTC signaling 1:1 + malha) on port ${PORT}`)
})

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  httpServer.close(() => process.exit(0))
})

// b64url mantido para utilidade futura (ex.: logs de payload)
void b64url
