'use client'

/**
 * MentorHub Live — sala de vídeo 1:1 própria (WebRTC P2P + sinalização socket.io).
 *
 * Por que não Jitsi: o meet.jit.si público prende todo mundo num lobby que pede
 * para "logar como moderador" — a mesma tela de anfitrião aparecia para mentor
 * E aluno. Aqui o papel (HOST = mentor) vem assinado do backend no token e a
 * sala simplesmente funciona: sem login externo, sem "quem é o anfitrião?".
 *
 * Negociação perfeita (perfect negotiation): HOST impolite, GUEST polite.
 * Ofertas só voam quando o par está na sala — sem offer perdida no vazio.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import {
  Camera,
  CameraOff,
  CircleDot,
  Loader2,
  MessageSquareWarning,
  Mic,
  MicOff,
  MonitorUp,
  MonitorX,
  PhoneOff,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import { toast } from 'sonner'

type MeetingRole = 'HOST' | 'GUEST'
type ConnState = 'preparing' | 'waiting' | 'connecting' | 'connected' | 'reconnecting' | 'failed'

interface RemoteMediaState {
  audio: boolean
  video: boolean
  screen: boolean
}

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302'] },
    {
      // TURN público de fallback (Open Relay Project) para NAT simétrico
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

export function MeetingStage({
  bookingId,
  role,
  selfName,
  peerName,
  peerIsMentor,
}: {
  bookingId: string
  role: MeetingRole
  selfName: string
  peerName: string
  peerIsMentor: boolean
}) {
  const polite = role === 'GUEST'

  // ---------- estado de UI ----------
  const [state, setState] = useState<ConnState>('preparing')
  const [statusMsg, setStatusMsg] = useState('Preparando a sala…')
  const [mediaError, setMediaError] = useState<'none' | 'denied' | 'unsupported'>('none')
  const [audioOn, setAudioOn] = useState(false)
  const [videoOn, setVideoOn] = useState(false)
  const [screenOn, setScreenOn] = useState(false)
  const [remoteMedia, setRemoteMedia] = useState<RemoteMediaState>({ audio: true, video: true, screen: false })
  const [peerOnline, setPeerOnline] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // ---------- refs de infra ----------
  const socketRef = useRef<Socket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null)
  const screenTrackRef = useRef<MediaStreamTrack | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const tokenRef = useRef<string | null>(null)
  const joinedRef = useRef(false)

  // refs da negociação perfeita
  const makingOfferRef = useRef(false)
  const ignoreOfferRef = useRef(false)
  const settingRemoteAnswerRef = useRef(false)

  const connectedAtRef = useRef<number | null>(null)

  // ---------- helpers de mídia ----------
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
      // cai para só-áudio antes de desistir
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

  // ---------- peer connection (perfect negotiation) ----------
  const ensurePeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current
    const pc = new RTCPeerConnection(ICE_CONFIG)
    pcRef.current = pc

    // garante negociação mesmo sem nenhuma faixa de mídia (ex.: permissão negada)
    pc.createDataChannel('mh-control')

    // faixas locais existentes
    const stream = localStreamRef.current
    if (stream) {
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream)
      }
    }

    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true
        await pc.setLocalDescription()
        if (pc.localDescription && socketRef.current?.connected) {
          socketRef.current.emit('signal', { kind: 'desc', data: pc.localDescription })
        }
      } catch {
        /* colisão tratada no handler de desc */
      } finally {
        makingOfferRef.current = false
      }
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current?.connected) {
        socketRef.current.emit('signal', { kind: 'cand', data: candidate })
      }
    }

    pc.ontrack = ({ track, streams }) => {
      const el = remoteVideoRef.current
      const remoteStream = streams[0]
      if (el && remoteStream && el.srcObject !== remoteStream) {
        el.srcObject = remoteStream
        el.play().catch(() => {})
      }
      track.onended = () => {
        // fim de compartilhamento de tela do par: volta ao estado normal
        setRemoteMedia((s) => ({ ...s, screen: false }))
      }
    }

    pc.oniceconnectionstatechange = () => {
      const st = pc.iceConnectionState
      if (st === 'connected' || st === 'completed') {
        if (connectedAtRef.current == null) connectedAtRef.current = Date.now()
        setState((s) => (s === 'reconnecting' ? 'connected' : s))
        setState('connected')
        setStatusMsg('Conectado')
      } else if (st === 'disconnected') {
        setState((s) => (s === 'connected' ? 'reconnecting' : s))
        setStatusMsg('Conexão instável — tentando recuperar…')
      } else if (st === 'failed') {
        setState('failed')
        setStatusMsg('Não foi possível estabelecer a conexão de vídeo.')
      } else if (st === 'checking') {
        setState((s) => (s === 'waiting' || s === 'preparing' ? 'connecting' : s))
        setStatusMsg('Conectando…')
      }
    }

    return pc
  }, [])

  // ---------- ciclo de vida da sala ----------
  const teardownCall = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null
    connectedAtRef.current = null
    setElapsed(0)
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    makingOfferRef.current = false
    ignoreOfferRef.current = false
    settingRemoteAnswerRef.current = false
  }, [])

  const connectToRoom = useCallback(async () => {
    setState('preparing')
    setStatusMsg('Preparando a sala…')
    setPeerOnline(false)
    teardownCall()
    // retry: encerra sinalização anterior antes de recomeçar limpo
    socketRef.current?.disconnect()
    socketRef.current = null

    // token assinado pelo backend (papel HOST/GUEST validado no servidor)
    let token: string
    try {
      const cred = await api.getMeetingToken(bookingId)
      token = cred.token
      tokenRef.current = cred.token
    } catch (e) {
      setState('failed')
      setStatusMsg(e instanceof Error ? e.message : 'Não foi possível abrir a sala.')
      return
    }

    await acquireMedia()

    // conecta na sinalização (gateway: XTransformPort, path '/')
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
      joinedRef.current = false
      // ICE P2P pode continuar de pé mesmo sem sinalização — só avisa se já estava em chamada
      setState((s) => (s === 'connected' ? 'reconnecting' : s))
    })

    socket.on('meeting-error', (err: { message?: string }) => {
      setState('failed')
      setStatusMsg(err?.message || 'Erro na sala de reunião.')
    })

    socket.on('joined', () => {
      joinedRef.current = true
      setState((s) => (s === 'connected' ? s : 'waiting'))
      setStatusMsg((m) => (m === 'Conectado' ? m : `Sala pronta — aguardando ${peerName}…`))
    })

    socket.on('peer-joined', () => {
      setPeerOnline(true)
      // HOST inicia a oferta quando o par chega; GUEST prepara e espera
      ensurePeerConnection()
      setState((s) => (s === 'connected' ? s : 'connecting'))
      setStatusMsg('Conectando…')
    })

    socket.on('peer-left', () => {
      setPeerOnline(false)
      teardownCall()
      setState('waiting')
      setStatusMsg(`${peerName} saiu — aguardando retorno…`)
    })

    // negociação perfeita (padrão do spec WebRTC)
    socket.on('signal', async ({ kind, data }: { kind: string; data: unknown }) => {
      const pc = ensurePeerConnection()
      try {
        if (kind === 'desc') {
          const description = data as RTCSessionDescriptionInit
          const readyForOffer =
            !makingOfferRef.current &&
            (pc.signalingState === 'stable' || settingRemoteAnswerRef.current)
          const offerCollision = description.type === 'offer' && !readyForOffer
          ignoreOfferRef.current = offerCollision && !polite
          if (ignoreOfferRef.current) return

          settingRemoteAnswerRef.current = description.type === 'answer'
          await pc.setRemoteDescription(description)
          settingRemoteAnswerRef.current = false

          if (description.type === 'offer') {
            await pc.setLocalDescription()
            if (pc.localDescription && socketRef.current?.connected) {
              socketRef.current.emit('signal', { kind: 'desc', data: pc.localDescription })
            }
          }
        } else if (kind === 'cand') {
          try {
            await pc.addIceCandidate(data as RTCIceCandidateInit)
          } catch (err) {
            if (!ignoreOfferRef.current) {
              // candidato pode ter chegado antes do remote description — ignora sem quebrar
              console.warn('[meeting] addIceCandidate', err)
            }
          }
        }
      } catch (err) {
        console.warn('[meeting] signal', err)
      }
    })

    socket.on('media-state', (st: RemoteMediaState) => {
      setRemoteMedia({ audio: Boolean(st?.audio), video: Boolean(st?.video), screen: Boolean(st?.screen) })
    })

    socket.io.on('reconnect', () => {
      // volta a sinalização: re-entra na sala e refaz o par
      if (tokenRef.current) socket.emit('join', { token: tokenRef.current })
    })
  }, [acquireMedia, bookingId, ensurePeerConnection, peerName, polite, teardownCall])

  // ---------- controles ----------
  const toggleAudio = useCallback(async () => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (!track) {
      toast.error('Microfone não disponível neste dispositivo.')
      return
    }
    track.enabled = !track.enabled
    setAudioOn(track.enabled)
    socketRef.current?.emit('media-state', {
      audio: track.enabled,
      video: videoOn,
      screen: screenOn,
    })
  }, [screenOn, videoOn])

  const toggleVideo = useCallback(async () => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (!track) {
      // sem câmera ainda: tenta adquirir agora (ex.: permissão dada depois)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, facingMode: 'user' },
        })
        const video = stream.getVideoTracks()[0]
        localStreamRef.current?.addTrack(video)
        cameraTrackRef.current = video
        const pc = ensurePeerConnection()
        pc.addTrack(video, stream)
        attachLocalPreview()
        setVideoOn(true)
        setMediaError('none')
        socketRef.current?.emit('media-state', { audio: audioOn, video: true, screen: screenOn })
        return
      } catch {
        toast.error('Não foi possível acessar a câmera.')
        return
      }
    }
    track.enabled = !track.enabled
    setVideoOn(track.enabled)
    socketRef.current?.emit('media-state', {
      audio: audioOn,
      video: track.enabled,
      screen: screenOn,
    })
  }, [attachLocalPreview, audioOn, ensurePeerConnection, screenOn])

  const stopScreenShare = useCallback(() => {
    const pc = pcRef.current
    const screen = screenTrackRef.current
    const camera = cameraTrackRef.current
    if (screen) {
      screen.stop()
      screenTrackRef.current = null
    }
    if (pc) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
      if (sender) {
        if (camera) void sender.replaceTrack(camera)
        else void sender.replaceTrack(null)
      }
    }
    setScreenOn(false)
    socketRef.current?.emit('media-state', { audio: audioOn, video: videoOn, screen: false })
  }, [audioOn, videoOn])

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

      const pc = ensurePeerConnection()
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
      if (sender) {
        await sender.replaceTrack(screen)
      } else {
        pc.addTrack(screen, stream)
      }
      setScreenOn(true)
      socketRef.current?.emit('media-state', { audio: audioOn, video: videoOn, screen: true })
    } catch {
      /* usuário cancelou o seletor */
    }
  }, [audioOn, screenOn, stopScreenShare, videoOn])

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave')
    teardownCall()
    socketRef.current?.disconnect()
    socketRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setState('preparing')
  }, [teardownCall])

  // ---------- efeitos ----------
  useEffect(() => {
    void connectToRoom()
    return () => {
      leaveRoom()
    }
  }, [bookingId])

  // cronômetro da chamada
  useEffect(() => {
    if (state !== 'connected') return
    const iv = window.setInterval(() => {
      if (connectedAtRef.current) setElapsed(Math.floor((Date.now() - connectedAtRef.current) / 1000))
    }, 1000)
    return () => window.clearInterval(iv)
  }, [state])

  // preview local (ref pode montar depois do stream chegar)
  useEffect(() => {
    attachLocalPreview()
  }, [attachLocalPreview])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  const statePill =
    state === 'preparing' ? (
      <Badge className="gap-1 border-transparent bg-stone-700 text-white">
        <Loader2 className="h-3 w-3 animate-spin" /> preparando…
      </Badge>
    ) : state === 'waiting' ? (
      <Badge className="gap-1 border-transparent bg-amber-600 text-white">
        <CircleDot className="h-3 w-3 animate-pulse" /> aguardando {peerName.split(' ')[0]}…
      </Badge>
    ) : state === 'connecting' || state === 'reconnecting' ? (
      <Badge className="gap-1 border-transparent bg-amber-600 text-white">
        <Loader2 className="h-3 w-3 animate-spin" /> conectando…
      </Badge>
    ) : state === 'connected' ? (
      <Badge className="gap-1 border-transparent bg-emerald-600 text-white">
        <CircleDot className="h-3 w-3" /> ao vivo · {mm}:{ss}
      </Badge>
    ) : (
      <Badge className="gap-1 border-transparent bg-rose-700 text-white">
        <MessageSquareWarning className="h-3 w-3" /> falhou
      </Badge>
    )

  return (
    <div className="space-y-3">
      {/* ---------- PALCO DE VÍDEO ---------- */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-xl">
        {/* vídeo remoto (ou local enquanto o par não chega) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={
            'h-[46vh] min-h-[300px] w-full bg-stone-950 object-cover sm:h-[56vh] ' +
            (state === 'connected' && peerOnline ? '' : 'opacity-0')
          }
          aria-label={`Vídeo de ${peerName}`}
        />

        {/* fallback visual enquanto não há vídeo remoto */}
        {!(state === 'connected' && peerOnline) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            {state === 'failed' ? (
              <>
                <MessageSquareWarning className="h-10 w-10 text-rose-400" />
                <p className="max-w-sm text-sm text-stone-200">{statusMsg}</p>
                <Button
                  variant="outline"
                  className="border-stone-600 bg-transparent text-stone-100 hover:bg-stone-800 hover:text-white"
                  onClick={() => void connectToRoom()}
                >
                  <RefreshCw className="h-4 w-4" /> Tentar novamente
                </Button>
              </>
            ) : (
              <>
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-800 text-2xl font-extrabold text-stone-300">
                  {peerName
                    .split(' ')
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')}
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-stone-100">{peerName}</p>
                  <p className="text-sm text-stone-400">{statusMsg}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* barra superior: status + segurança */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-3">
          <div className="flex flex-wrap items-center gap-2">{statePill}</div>
          <span className="hidden items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-stone-200 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> P2P criptografado
          </span>
        </div>

        {/* nome + papel do par (badge de anfitrião vem do servidor) */}
        {state === 'connected' && peerOnline && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              {peerName}
              {peerIsMentor && (
                <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  Anfitrião · Mentor
                </span>
              )}
              {!remoteMedia.audio && <MicOff className="h-3.5 w-3.5 text-rose-400" />}
              {!remoteMedia.video && <CameraOff className="h-3.5 w-3.5 text-rose-400" />}
              {remoteMedia.screen && <MonitorUp className="h-3.5 w-3.5 text-amber-300" />}
            </span>
          </div>
        )}

        {/* PiP local */}
        <div className="absolute bottom-3 right-3 h-[72px] w-[110px] overflow-hidden rounded-xl border border-stone-700 bg-stone-900 shadow-lg sm:h-[96px] sm:w-[150px]">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={'h-full w-full scale-x-[-1] object-cover ' + (videoOn ? '' : 'opacity-0')}
            aria-label="Seu vídeo"
          />
          {!videoOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <CameraOff className="h-5 w-5 text-stone-500" />
            </div>
          )}
          <span className="absolute bottom-1 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Você {role === 'HOST' && '· Anfitrião'}
          </span>
        </div>
      </div>

      {/* aviso de permissão de mídia */}
      {mediaError !== 'none' && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <MessageSquareWarning className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          <p>
            {mediaError === 'denied'
              ? 'Câmera/microfone não autorizados. Você ainda entra na sala e pode ativar no botão de câmera quando quiser.'
              : 'Este navegador não oferece câmera/microfone. Você participa só com o restante da sala.'}
          </p>
        </div>
      )}

      {/* ---------- BARRA DE CONTROLES FIXA (sticky acima da tab bar no mobile) ---------- */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 rounded-t-2xl border border-stone-200 bg-white/95 px-3 py-2.5 shadow-[0_-6px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:-mx-6 sm:rounded-2xl dark:border-stone-800 dark:bg-stone-900/95 md:bottom-0 md:mx-0">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => void toggleAudio()}
            aria-pressed={audioOn}
            aria-label={audioOn ? 'Desativar microfone' : 'Ativar microfone'}
            className={
              'flex h-11 min-w-11 items-center justify-center rounded-full border transition-colors ' +
              (audioOn
                ? 'border-stone-300 bg-stone-100 text-stone-800 hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700'
                : 'border-rose-300 bg-rose-600 text-white hover:bg-rose-700 dark:border-rose-800')
            }
          >
            {audioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => void toggleVideo()}
            aria-pressed={videoOn}
            aria-label={videoOn ? 'Desativar câmera' : 'Ativar câmera'}
            className={
              'flex h-11 min-w-11 items-center justify-center rounded-full border transition-colors ' +
              (videoOn
                ? 'border-stone-300 bg-stone-100 text-stone-800 hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700'
                : 'border-rose-300 bg-rose-600 text-white hover:bg-rose-700 dark:border-rose-800')
            }
          >
            {videoOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => void toggleScreen()}
            aria-pressed={screenOn}
            aria-label={screenOn ? 'Parar de compartilhar tela' : 'Compartilhar tela'}
            className={
              'flex h-11 min-w-11 items-center justify-center rounded-full border transition-colors ' +
              (screenOn
                ? 'border-amber-300 bg-amber-500 text-stone-900 hover:bg-amber-600 dark:border-amber-700'
                : 'border-stone-300 bg-stone-100 text-stone-800 hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700')
            }
          >
            {screenOn ? <MonitorX className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
          </button>

          <div className="mx-1 hidden h-8 w-px bg-stone-200 sm:block dark:bg-stone-700" aria-hidden />

          <Button
            variant="destructive"
            className="h-11 rounded-full px-5 font-bold"
            onClick={() => {
              leaveRoom()
              toast.success('Você saiu da sala de vídeo.')
            }}
          >
            <PhoneOff className="h-4 w-4" /> Sair
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground" aria-live="polite">
          {state === 'connected' ? `Conectado · ${mm}:${ss} de sessão` : statusMsg}
        </p>
      </div>
    </div>
  )
}
