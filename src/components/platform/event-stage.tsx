'use client'

/**
 * MentorHub Reunião — sala de vídeo MULTI-PARTICIPANTE (WebRTC em malha).
 *
 * O diferencial da plataforma: reuniões com vários membros DENTRO do
 * MentorHub — sem YouTube, sem Meet externo. Cada participante tem um
 * RTCPeerConnection com cada outro participante (mesh), sinalização
 * ponto a ponto pelo meeting-service (`to`/`from` com userId).
 *
 * A capacidade (2..12) vem ASSINADA no token — é ela que liga o modo malha
 * no meeting-service. O papel (HOST = anfitrião do evento) também é
 * decidido no backend; o cliente nunca se autodeclara.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import {
  Camera,
  CameraOff,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  MonitorX,
  PhoneOff,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import { toast } from 'sonner'

type MeetingRole = 'HOST' | 'GUEST'
type ConnState = 'preparing' | 'waiting' | 'connecting' | 'connected' | 'reconnecting' | 'failed'

interface PeerInfo {
  uid: string
  name: string
  role: MeetingRole
  audio: boolean
  video: boolean
  screen: boolean
  connecting: boolean
}

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302'] },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 4,
}

interface PeerConn {
  pc: RTCPeerConnection
  makingOffer: boolean
  ignoreOffer: boolean
  settingRemoteAnswer: boolean
  /** eu sou "polite" quando meu uid é maior — desempate estável de colisão */
  polite: boolean
}

export function EventStage({ eventId, title }: { eventId: string; title: string }) {
  const [state, setState] = useState<ConnState>('preparing')
  const [statusMsg, setStatusMsg] = useState('Preparando a sala…')
  const [mediaError, setMediaError] = useState<'none' | 'denied' | 'unsupported'>('none')
  const [audioOn, setAudioOn] = useState(false)
  const [videoOn, setVideoOn] = useState(false)
  const [screenOn, setScreenOn] = useState(false)
  const [peers, setPeers] = useState<PeerInfo[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [capacity, setCapacity] = useState(0)

  const socketRef = useRef<Socket | null>(null)
  const connsRef = useRef<Map<string, PeerConn>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null)
  const screenTrackRef = useRef<MediaStreamTrack | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const tokenRef = useRef<string | null>(null)
  const myUidRef = useRef<string>('')
  const connectedAtRef = useRef<number | null>(null)
  const videoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map())

  /* ---------- vídeo local ---------- */
  const attachLocalPreview = useCallback(() => {
    const el = localVideoRef.current
    if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
      el.srcObject = localStreamRef.current
      el.play().catch(() => {})
    }
  }, [])

  const acquireMedia = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMediaError('unsupported')
      return
    }
    if (localStreamRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      localStreamRef.current = stream
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        localStreamRef.current = stream
        toast.info('Câmera indisponível — entrando só com áudio.')
      } catch {
        setMediaError('denied')
        return
      }
    }
    const stream = localStreamRef.current
    const audio = stream?.getAudioTracks()[0] ?? null
    const video = stream?.getVideoTracks()[0] ?? null
    cameraTrackRef.current = video
    if (audio) {
      audio.enabled = true
      setAudioOn(true)
    }
    if (video) {
      video.enabled = true
      setVideoOn(true)
    }
    attachLocalPreview()
  }, [attachLocalPreview])

  /* ---------- peer connections (malha) ---------- */
  const ensureConn = useCallback((uid: string): PeerConn => {
    let conn = connsRef.current.get(uid)
    if (conn) return conn
    const pc = new RTCPeerConnection(ICE_CONFIG)
    pc.createDataChannel('mh-control')
    const stream = localStreamRef.current
    if (stream) {
      for (const track of stream.getTracks()) pc.addTrack(track, stream)
    }
    conn = {
      pc,
      makingOffer: false,
      ignoreOffer: false,
      settingRemoteAnswer: false,
      polite: myUidRef.current > uid,
    }
    connsRef.current.set(uid, conn)

    pc.onnegotiationneeded = async () => {
      try {
        conn!.makingOffer = true
        await pc.setLocalDescription()
        if (pc.localDescription && socketRef.current?.connected) {
          socketRef.current.emit('signal', {
            kind: 'desc',
            data: pc.localDescription,
            to: uid,
          })
        }
      } catch {
        /* colisão tratada no handler de desc */
      } finally {
        conn!.makingOffer = false
      }
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current?.connected) {
        socketRef.current.emit('signal', { kind: 'cand', data: candidate, to: uid })
      }
    }

    pc.ontrack = ({ track, streams }) => {
      const remote = streams[0]
      const el = videoElsRef.current.get(uid)
      if (el && remote && el.srcObject !== remote) {
        el.srcObject = remote
        el.play().catch(() => {})
      }
      track.onended = () => {
        setPeers((list) => list.map((p) => (p.uid === uid ? { ...p, screen: false } : p)))
      }
      setPeers((list) => list.map((p) => (p.uid === uid ? { ...p, connecting: false } : p)))
    }

    pc.oniceconnectionstatechange = () => {
      const st = pc.iceConnectionState
      if (st === 'connected' || st === 'completed') {
        if (connectedAtRef.current == null) connectedAtRef.current = Date.now()
        setState('connected')
        setStatusMsg('Ao vivo')
      } else if (st === 'failed') {
        // um par caindo não derruba a sala — só marca o tile como instável
        setPeers((list) => list.map((p) => (p.uid === uid ? { ...p, connecting: true } : p)))
      }
    }
    return conn
  }, [])

  const addPeer = useCallback(
    (uid: string, name: string, role: MeetingRole) => {
      setPeers((list) =>
        list.some((p) => p.uid === uid)
          ? list.map((p) => (p.uid === uid ? { ...p, name, role } : p))
          : [...list, { uid, name, role, audio: true, video: true, screen: false, connecting: true }]
      )
    },
    []
  )

  const dropPeer = useCallback((uid: string) => {
    const conn = connsRef.current.get(uid)
    if (conn) {
      conn.pc.close()
      connsRef.current.delete(uid)
    }
    videoElsRef.current.delete(uid)
    setPeers((list) => list.filter((p) => p.uid !== uid))
  }, [])

  /* ---------- ciclo de vida ---------- */
  const teardownAll = useCallback(() => {
    connsRef.current.forEach((c) => c.pc.close())
    connsRef.current.clear()
    connectedAtRef.current = null
    setElapsed(0)
  }, [])

  const connectToRoom = useCallback(async () => {
    setState('preparing')
    setStatusMsg('Preparando a sala…')
    setPeers([])
    teardownAll()
    socketRef.current?.disconnect()
    socketRef.current = null

    let token: string
    try {
      const cred = await api.getEventMeetingToken(eventId)
      token = cred.token
      tokenRef.current = cred.token
      setCapacity(cred.capacity)
      try {
        const payload = JSON.parse(atob(cred.token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')))
        myUidRef.current = String(payload.u ?? '')
      } catch {
        /* uid opcional — só usado para desempate de negociação */
      }
    } catch (e) {
      setState('failed')
      setStatusMsg(e instanceof Error ? e.message : 'Não foi possível abrir a sala.')
      return
    }

    await acquireMedia()

    const socket = io('/?XTransformPort=3004', {
      path: '/',
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
      timeout: 10000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', { token })
    })

    socket.on('disconnect', () => {
      setState((s) => (s === 'connected' ? 'reconnecting' : s))
    })

    socket.on('meeting-error', (err: { message?: string }) => {
      setState('failed')
      setStatusMsg(err?.message || 'Erro na sala de reunião.')
    })

    socket.on(
      'joined',
      (info: { peers?: { uid: string; name: string; role: string }[]; capacity?: number }) => {
        setState('waiting')
        const list = info?.peers ?? []
        if (info?.capacity) setCapacity(info.capacity)
        if (list.length === 0) {
          setStatusMsg('Você é o primeiro — aguardando os participantes…')
        } else {
          setState('connecting')
          setStatusMsg(`Conectando com ${list.length} participante${list.length > 1 ? 's' : ''}…`)
          for (const p of list) {
            addPeer(p.uid, p.name, (p.role as MeetingRole) || 'GUEST')
            ensureConn(p.uid)
          }
        }
      }
    )

    socket.on('peer-joined', (info: { uid?: string; name?: string; role?: string }) => {
      if (!info?.uid || info.uid === myUidRef.current) return
      // reconexão do par: derruba a conexão antiga e espera a oferta dele
      dropPeer(info.uid)
      addPeer(info.uid, info.name || 'Participante', (info.role as MeetingRole) || 'GUEST')
      ensureConn(info.uid)
      setState((s) => (s === 'connected' ? s : 'connecting'))
    })

    socket.on('peer-left', (info: { uid?: string; name?: string }) => {
      if (!info?.uid) return
      dropPeer(info.uid)
      setState((s) => (s === 'connected' ? s : 'waiting'))
      setStatusMsg((m) =>
        connsRef.current.size === 0 && connectedAtRef.current == null
          ? 'Você é o único na sala — os outros podem voltar a qualquer momento.'
          : m
      )
    })

    socket.on(
      'signal',
      async (msg: { kind: string; data: unknown; from?: string }) => {
        const uid = msg?.from
        if (!uid || uid === myUidRef.current) return
        const conn = ensureConn(uid)
        try {
          if (msg.kind === 'desc') {
            const description = msg.data as RTCSessionDescriptionInit
            const readyForOffer =
              !conn.makingOffer &&
              (conn.pc.signalingState === 'stable' || conn.settingRemoteAnswer)
            const offerCollision = description.type === 'offer' && !readyForOffer
            conn.ignoreOffer = offerCollision && !conn.polite
            if (conn.ignoreOffer) return
            conn.settingRemoteAnswer = description.type === 'answer'
            await conn.pc.setRemoteDescription(description)
            conn.settingRemoteAnswer = false
            if (description.type === 'offer') {
              await conn.pc.setLocalDescription()
              if (conn.pc.localDescription && socketRef.current?.connected) {
                socketRef.current.emit('signal', {
                  kind: 'desc',
                  data: conn.pc.localDescription,
                  to: uid,
                })
              }
            }
          } else if (msg.kind === 'cand') {
            try {
              await conn.pc.addIceCandidate(msg.data as RTCIceCandidateInit)
            } catch (err) {
              if (!conn.ignoreOffer) console.warn('[event-room] addIceCandidate', err)
            }
          }
        } catch (err) {
          console.warn('[event-room] signal', err)
        }
      }
    )

    socket.on(
      'media-state',
      (st: { uid?: string; audio?: boolean; video?: boolean; screen?: boolean }) => {
        if (!st?.uid) return
        setPeers((list) =>
          list.map((p) =>
            p.uid === st.uid
              ? {
                  ...p,
                  audio: Boolean(st.audio),
                  video: Boolean(st.video),
                  screen: Boolean(st.screen),
                }
              : p
          )
        )
      }
    )

    socket.io.on('reconnect', () => {
      if (tokenRef.current) socket.emit('join', { token: tokenRef.current })
    })
  }, [acquireMedia, addPeer, dropPeer, ensureConn, eventId, teardownAll])

  /* ---------- controles ---------- */
  const emitMediaState = useCallback(
    (next: { audio: boolean; video: boolean; screen: boolean }) => {
      socketRef.current?.emit('media-state', next)
    },
    []
  )

  const toggleAudio = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (!track) {
      toast.error('Microfone não disponível neste dispositivo.')
      return
    }
    track.enabled = !track.enabled
    setAudioOn(track.enabled)
    emitMediaState({ audio: track.enabled, video: videoOn, screen: screenOn })
  }, [emitMediaState, screenOn, videoOn])

  const toggleVideo = useCallback(async () => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (!track) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, facingMode: 'user' },
        })
        const video = stream.getVideoTracks()[0]
        localStreamRef.current?.addTrack(video)
        cameraTrackRef.current = video
        connsRef.current.forEach(({ pc }) => pc.addTrack(video, stream))
        attachLocalPreview()
        setVideoOn(true)
        setMediaError('none')
        emitMediaState({ audio: audioOn, video: true, screen: screenOn })
        return
      } catch {
        toast.error('Não foi possível acessar a câmera.')
        return
      }
    }
    track.enabled = !track.enabled
    setVideoOn(track.enabled)
    emitMediaState({ audio: audioOn, video: track.enabled, screen: screenOn })
  }, [attachLocalPreview, audioOn, emitMediaState, screenOn])

  const stopScreenShare = useCallback(() => {
    const screen = screenTrackRef.current
    const camera = cameraTrackRef.current
    if (screen) {
      screen.stop()
      screenTrackRef.current = null
    }
    connsRef.current.forEach(({ pc }) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
      if (sender) {
        if (camera) void sender.replaceTrack(camera)
        else void sender.replaceTrack(null)
      }
    })
    setScreenOn(false)
    emitMediaState({ audio: audioOn, video: videoOn, screen: false })
  }, [audioOn, emitMediaState, videoOn])

  const toggleScreen = useCallback(async () => {
    if (screenOn) {
      stopScreenShare()
      return
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      toast.error('Compartilhar tela não é suportado neste dispositivo.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const screen = stream.getVideoTracks()[0]
      screenTrackRef.current = screen
      screen.onended = () => stopScreenShare()
      connsRef.current.forEach(({ pc }) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
        if (sender) void sender.replaceTrack(screen)
        else pc.addTrack(screen, stream)
      })
      setScreenOn(true)
      emitMediaState({ audio: audioOn, video: videoOn, screen: true })
    } catch {
      /* usuário cancelou o seletor */
    }
  }, [audioOn, emitMediaState, screenOn, stopScreenShare, videoOn])

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave')
    teardownAll()
    socketRef.current?.disconnect()
    socketRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setState('preparing')
  }, [teardownAll])

  useEffect(() => {
    void connectToRoom()
    return () => {
      leaveRoom()
    }
  }, [eventId])

  useEffect(() => {
    if (state !== 'connected' || connectedAtRef.current == null) return
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (connectedAtRef.current ?? Date.now())) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [state])

  const fmt = (s: number) =>
    [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((v) => String(v).padStart(2, '0'))
      .filter((v, i) => i > 0 || v !== '00')
      .join(':')

  /* ---------- render ---------- */
  const tileCount = peers.length + 1
  const gridCols =
    tileCount <= 1 ? 'grid-cols-1' : tileCount <= 4 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-950 dark:border-stone-800">
      {/* barra superior */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-800 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
            <Users className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-stone-50">{title}</p>
            <p className="text-[11px] text-stone-400">
              reunião da plataforma · até {capacity || '—'} participantes
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {state === 'connected' ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                AO VIVO {elapsed > 0 && <span className="tabular-nums text-stone-400">· {fmt(elapsed)}</span>}
              </span>
            </>
          ) : (
            <Badge variant="outline" className="border-stone-700 text-stone-300">
              {statusMsg.slice(0, 38)}
            </Badge>
          )}
          <Badge variant="outline" className="border-stone-700 text-stone-300">
            👥 {peers.length + 1}
            {capacity ? `/${capacity}` : ''}
          </Badge>
        </div>
      </div>

      {/* grade de vídeos */}
      <div className="relative aspect-video w-full sm:aspect-[16/8]">
        {mediaError === 'denied' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <CameraOff className="h-10 w-10 text-stone-500" />
            <p className="text-sm font-semibold text-stone-200">Câmera e microfone bloqueados</p>
            <p className="max-w-sm text-xs text-stone-400">
              Permita o acesso no navegador para participar com vídeo e áudio — a sala continua
              aberta para você tentar de novo pelos botões abaixo.
            </p>
          </div>
        ) : (
          <div className={`absolute inset-0 grid gap-1.5 p-1.5 ${gridCols}`}>
            {/* tile local */}
            <div className="relative overflow-hidden rounded-xl border border-emerald-500/40 bg-stone-900">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full scale-x-[-1] object-cover"
              />
              {!videoOn && localStreamRef.current && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-stone-900">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-800 text-sm font-bold text-stone-300">
                    eu
                  </span>
                  <span className="text-[10px] font-semibold text-stone-400">câmera desligada</span>
                </div>
              )}
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                você
                {!audioOn && <MicOff className="h-3 w-3 text-rose-400" />}
              </div>
              {screenOn && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-bold text-blue-300">
                  🖥 tela
                </span>
              )}
            </div>

            {/* tiles remotos */}
            {peers.map((p) => (
              <div
                key={p.uid}
                className="relative overflow-hidden rounded-xl border border-stone-800 bg-stone-900"
              >
                <video
                  ref={(el) => {
                    if (el) {
                      videoElsRef.current.set(p.uid, el)
                    } else {
                      videoElsRef.current.delete(p.uid)
                    }
                  }}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                {(p.connecting || (!p.video && !p.screen)) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-stone-900">
                    <Avatar name={p.name} size="lg" />
                    <span className="text-[10px] font-semibold text-stone-400">
                      {p.connecting ? 'conectando…' : 'câmera desligada'}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                  {p.name}
                  {p.role === 'HOST' && (
                    <span className="rounded bg-amber-400/20 px-1 py-px text-[8px] font-extrabold tracking-wide text-amber-300">
                      ANFITRIÃO
                    </span>
                  )}
                  {!p.audio && <MicOff className="h-3 w-3 text-rose-400" />}
                </div>
                {p.screen && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-bold text-blue-300">
                    🖥 tela
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* estado central (aguardando/falha) */}
        {(state === 'waiting' || state === 'failed' || state === 'preparing') &&
          mediaError !== 'denied' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-stone-950/80 p-6 text-center backdrop-blur-sm">
              {state === 'failed' ? (
                <>
                  <p className="text-sm font-bold text-rose-300">{statusMsg}</p>
                  <Button size="sm" variant="outline" onClick={() => void connectToRoom()}>
                    Tentar de novo
                  </Button>
                </>
              ) : (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                  <p className="text-sm font-semibold text-stone-200">{statusMsg}</p>
                  <p className="max-w-sm text-xs text-stone-400">
                    A reunião começa automaticamente quando os participantes entrarem. Convide mais
                    gente pela página do evento!
                  </p>
                </>
              )}
            </div>
          )}
      </div>

      {/* controles */}
      <div className="flex items-center justify-center gap-2.5 border-t border-stone-800 px-4 py-3">
        <Button
          size="sm"
          variant={audioOn ? 'secondary' : 'destructive'}
          className="h-11 gap-1.5 rounded-full"
          onClick={toggleAudio}
          aria-label={audioOn ? 'Desligar microfone' : 'Ligar microfone'}
        >
          {audioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          <span className="text-xs">mic</span>
        </Button>
        <Button
          size="sm"
          className="h-11 gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500"
          onClick={() => {
            leaveRoom()
            toast.success('Você saiu da reunião.')
          }}
        >
          <PhoneOff className="h-4 w-4" />
          <span className="text-xs">sair</span>
        </Button>
        <Button
          size="sm"
          variant={videoOn ? 'secondary' : 'destructive'}
          className="h-11 gap-1.5 rounded-full"
          onClick={() => void toggleVideo()}
          aria-label={videoOn ? 'Desligar câmera' : 'Ligar câmera'}
        >
          {videoOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
          <span className="text-xs">câmera</span>
        </Button>
        <Button
          size="sm"
          variant={screenOn ? 'default' : 'secondary'}
          className="h-11 gap-1.5 rounded-full"
          onClick={() => void toggleScreen()}
          aria-label={screenOn ? 'Parar de compartilhar tela' : 'Compartilhar tela'}
        >
          {screenOn ? <MonitorX className="h-4 w-4" /> : <MonitorUp className="h-4 w-4" />}
          <span className="hidden text-xs sm:inline">{screenOn ? 'parar' : 'tela'}</span>
        </Button>
      </div>
    </div>
  )
}
