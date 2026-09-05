'use client'

/**
 * Eventos & Reuniões — o diferencial da plataforma: reuniões com vários
 * membros DENTRO do MentorHub (WebRTC em malha própria), sem YouTube e sem
 * links externos. Qualquer membro cria um evento e a sala multi-participante
 * abre na hora — círculo de estudos, plantão de dúvidas, defesa simulada…
 */

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Clock,
  Copy,
  Loader2,
  Radio,
  Users,
  Video,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Avatar } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import type { EventDTO } from '@/lib/types'
import {
  addMinutesToTime,
  formatDayLabelLong,
  formatTimeLabel,
  relativeDayLabel,
} from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

/** Gradiente por categoria (eventos sem capa ficam bonitos mesmo assim) */
const CATEGORY_STYLES: Record<string, string> = {
  Acadêmico: 'from-amber-500/80 to-orange-600/80',
  Tecnologia: 'from-emerald-500/80 to-teal-600/80',
  Carreira: 'from-rose-500/80 to-pink-600/80',
  Negócios: 'from-sky-500/80 to-cyan-600/80',
  Geral: 'from-stone-600/80 to-stone-700/80',
}
function coverStyle(category: string): string {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Geral
}

/* ==================== CARD DE EVENTO ==================== */
function EventCard({
  ev,
  onOpen,
  onUpdate,
}: {
  ev: EventDTO
  onOpen: () => void
  onUpdate: (next: EventDTO) => void
}) {
  const user = useAppStore((s) => s.user)
  const [busy, setBusy] = useState(false)

  const join = async () => {
    if (!user) return
    setBusy(true)
    try {
      const { event } = await api.joinEvent(ev.id)
      if (event) onUpdate(event)
      toast.success('Vaga confirmada! Você está participando. 🎉')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao participar')
    } finally {
      setBusy(false)
    }
  }

  const leave = async () => {
    setBusy(true)
    try {
      const { event } = await api.leaveEvent(ev.id)
      if (event) onUpdate(event)
      toast.info('Você saiu do evento.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao sair')
    } finally {
      setBusy(false)
    }
  }

  const relative = relativeDayLabel(ev.startsAt)
  const full = ev.seatsLeft <= 0

  return (
    <Card className="group overflow-hidden p-0 transition-shadow hover:shadow-lg">
      <button onClick={onOpen} className="block w-full text-left" aria-label={`Abrir evento ${ev.title}`}>
        <div className={`relative h-28 w-full bg-gradient-to-br sm:h-32 ${coverStyle(ev.category)}`}>
          {ev.coverUrl && (
            <img src={ev.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          )}
          <div className="absolute left-2.5 top-2.5 flex gap-1.5">
            {ev.live && (
              <Badge className="border-none bg-red-600 text-white shadow-lg">
                <Radio className="mr-1 h-3 w-3 animate-pulse" /> AO VIVO
              </Badge>
            )}
            {!ev.live && !ev.cancelled && relative && (
              <Badge className="border-none bg-black/50 text-white backdrop-blur">{relative}</Badge>
            )}
          </div>
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
            {ev.category}
          </span>
        </div>
      </button>
      <CardContent className="space-y-2.5 p-4">
        <button onClick={onOpen} className="block w-full text-left">
          <p className="line-clamp-2 font-bold leading-snug tracking-tight transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
            {ev.title}
          </p>
        </button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          {formatDayLabelLong(ev.startsAt)} · {formatTimeLabel(ev.startsAt)}
          → {addMinutesToTime(ev.startsAt, ev.durationMin)}
        </p>
        <div className="flex items-center gap-2">
          <Avatar name={ev.host.name} size="sm" />
          <p className="truncate text-xs text-muted-foreground">
            por <strong className="font-semibold text-stone-700 dark:text-stone-200">{ev.host.name}</strong>
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {ev.joinedCount}/{ev.capacity}
            {full && !ev.ended && (
              <span className="ml-1 font-bold text-rose-600 dark:text-rose-400">lotado</span>
            )}
          </span>
          {ev.cancelled ? (
            <Badge variant="outline" className="text-rose-600 dark:text-rose-400">
              Cancelado
            </Badge>
          ) : ev.isParticipant ? (
            ev.isHost ? (
              <Button size="sm" variant="outline" className="h-8" onClick={onOpen}>
                <Video className="mr-1 h-3.5 w-3.5" /> Abrir sala
              </Button>
            ) : (
              <div className="flex gap-1.5">
                <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-500" onClick={onOpen}>
                  Detalhes
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" disabled={busy} onClick={leave}>
                  Sair
                </Button>
              </div>
            )
          ) : ev.ended ? (
            <Badge variant="outline">Encerrado</Badge>
          ) : (
            <Button
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-500"
              disabled={busy || full}
              onClick={join}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : full ? 'Lotado' : 'Participar'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ==================== DIÁLOGO DE CRIAÇÃO ==================== */
function CreateEventDialog({ onCreated }: { onCreated: (ev: EventDTO) => void }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Geral')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [durationMin, setDurationMin] = useState(60)
  const [capacity, setCapacity] = useState(8)

  const submit = async () => {
    if (!date || !time) {
      toast.error('Escolha data e hora do evento.')
      return
    }
    setBusy(true)
    try {
      const { event } = await api.createEvent({
        title,
        description,
        category,
        startsAt: `${date}T${time}`,
        durationMin,
        capacity,
      })
      setOpen(false)
      setTitle('')
      setDescription('')
      setDate('')
      setTime('')
      toast.success('Evento criado! Divulgue e receba os participantes. 🎉')
      onCreated(event)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar o evento')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-500">
          <CalendarPlus className="h-4 w-4" /> Criar evento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar evento / reunião</DialogTitle>
          <DialogDescription>
            A sala de vídeo multi-participante roda aqui dentro da plataforma — os participantes
            entram com um toque, sem YouTube e sem links externos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="grid gap-1.5">
            <Label htmlFor="ev-title">Título</Label>
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Círculo de estudos — revisão para a prova"
              maxLength={120}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ev-desc">Descrição</Label>
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Do que se trata? Quem deve participar? O que será discutido?"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger aria-label="Categoria do evento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Acadêmico', 'Tecnologia', 'Carreira', 'Negócios', 'Geral'].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Duração: {durationMin} min</Label>
              <Slider
                value={[durationMin]}
                min={15}
                max={240}
                step={15}
                onValueChange={(v) => setDurationMin(v[0] ?? 60)}
                aria-label="Duração em minutos"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Vagas na sala: {capacity} participantes</Label>
            <Slider
              value={[capacity]}
              min={2}
              max={12}
              step={1}
              onValueChange={(v) => setCapacity(v[0] ?? 8)}
              aria-label="Capacidade da sala"
            />
            <p className="text-[11px] text-muted-foreground">
              Reunião por vídeo em malha — ideal para grupos de estudo e discussões.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-500"
            disabled={busy || title.trim().length < 3}
            onClick={() => void submit()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Criar evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ==================== LISTA ==================== */
export function EventsView() {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const [scope, setScope] = useState<'upcoming' | 'mine'>('upcoming')
  const [items, setItems] = useState<EventDTO[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { items } = await api.listEvents(scope)
      setItems(items)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => {
    void load()
  }, [load])

  // auto-refresh leve enquanto a aba está visível (mostra "AO VIVO" na hora certa)
  useEffect(() => {
    if (document.visibilityState !== 'visible') return
    const t = setInterval(() => void load(), 60_000)
    return () => clearInterval(t)
  }, [load])

  const liveNow = useMemo(() => items.filter((e) => e.live), [items])

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      {/* hero */}
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 dark:border-emerald-900 dark:from-emerald-950/40 dark:via-stone-950 dark:to-stone-950 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <Badge className="mb-3 border-none bg-emerald-600 text-white">
              <Radio className="mr-1 h-3 w-3" /> Diferencial MentorHub
            </Badge>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Eventos & Reuniões ao vivo
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Reuniões com <strong className="font-semibold text-stone-700 dark:text-stone-200">vários participantes</strong> —
              tudo dentro da plataforma, com vídeo e áudio próprios. Nada de YouTube ou links
              externos: crie um círculo de estudos, um plantão de dúvidas ou um evento e receba
              os membros na sala com um toque.
            </p>
          </div>
          {user && <CreateEventDialog onCreated={() => void load()} />}
        </div>
        {liveNow.length > 0 && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            {liveNow.length === 1
              ? '1 reunião ao vivo agora'
              : `${liveNow.length} reuniões ao vivo agora`}
          </p>
        )}
      </div>

      {/* abas */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex gap-1.5" role="tablist" aria-label="Escopo dos eventos">
          {(
            [
              { key: 'upcoming', label: 'Próximos eventos' },
              { key: 'mine', label: 'Meus eventos' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={scope === t.key}
              onClick={() => setScope(t.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                scope === t.key
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {!user && (
          <Button variant="outline" onClick={() => navigate({ name: 'auth', mode: 'login' })}>
            Entrar para participar
          </Button>
        )}
      </div>

      {/* grade */}
      {loading ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="mt-5 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <CalendarDays className="h-10 w-10 text-stone-400 dark:text-stone-500" />
            <p className="font-semibold">
              {scope === 'mine' ? 'Você ainda não participa de nenhum evento' : 'Nenhum evento agendado ainda'}
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {scope === 'mine'
                ? 'Entre em um evento próximo e reserve sua vaga — ou crie o seu próprio e convide a galera.'
                : 'Seja o primeiro: crie um evento e traga os membros para uma reunião ao vivo dentro da plataforma.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ev) => (
            <EventCard
              key={ev.id}
              ev={ev}
              onOpen={() => navigate({ name: 'event', eventId: ev.id })}
              onUpdate={(next) =>
                setItems((list) => list.map((it) => (it.id === next.id ? next : it)))
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ==================== DETALHE ==================== */
export function EventDetailView({ eventId }: { eventId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const [ev, setEv] = useState<EventDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(false)
  const [inRoom, setInRoom] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    try {
      const { event } = await api.getEvent(eventId)
      setEv(event)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  const join = async () => {
    if (!user) {
      navigate({ name: 'auth', mode: 'login' })
      return
    }
    setBusy(true)
    try {
      const { event } = await api.joinEvent(eventId)
      setEv(event)
      toast.success('Vaga confirmada! Você está participando. 🎉')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao participar')
    } finally {
      setBusy(false)
    }
  }

  const leave = async () => {
    setBusy(true)
    try {
      const { event } = await api.leaveEvent(eventId)
      setEv(event)
      toast.info('Você saiu do evento.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao sair')
    } finally {
      setBusy(false)
    }
  }

  const cancel = async () => {
    setBusy(true)
    try {
      await api.cancelEvent(eventId)
      toast.info('Evento cancelado. Os participantes foram avisados.')
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao cancelar')
    } finally {
      setBusy(false)
    }
  }

  const copyInvite = async () => {
    const url = typeof window === 'undefined' ? '' : `${window.location.origin}/?event=${eventId}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link do evento copiado!')
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <div className="h-8 w-52 animate-pulse rounded-lg bg-stone-100 dark:bg-stone-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
      </div>
    )
  }

  if (notFound || !ev) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <Card className="mx-auto max-w-md border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <CalendarDays className="h-10 w-10 text-stone-400" />
            <p className="font-semibold">Evento não encontrado</p>
            <Button onClick={() => navigate({ name: 'events' })}>Ver eventos</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const relative = relativeDayLabel(ev.startsAt)
  const full = ev.seatsLeft <= 0
  const canEnterRoom = !ev.cancelled && !ev.ended && ev.isParticipant
  const roomOpen = ev.openable

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6">
      <button
        onClick={() => navigate({ name: 'events' })}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-emerald-700 dark:text-stone-400 dark:hover:text-emerald-300"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para eventos
      </button>

      {/* capa */}
      <div
        className={`relative h-40 w-full overflow-hidden rounded-2xl bg-gradient-to-br sm:h-52 ${coverStyle(ev.category)}`}
      >
        {ev.coverUrl && (
          <img src={ev.coverUrl} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {ev.live && (
            <Badge className="border-none bg-red-600 text-white shadow-lg">
              <Radio className="mr-1 h-3 w-3 animate-pulse" /> AO VIVO AGORA
            </Badge>
          )}
          {ev.cancelled && (
            <Badge className="border-none bg-stone-800 text-stone-100">Cancelado</Badge>
          )}
          <Badge className="border-none bg-black/50 text-white backdrop-blur">{ev.category}</Badge>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight">{ev.title}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {relative && <strong className="text-stone-700 dark:text-stone-200">{relative} · </strong>}
            {formatDayLabelLong(ev.startsAt)} · {formatTimeLabel(ev.startsAt)} →{' '}
            {addMinutesToTime(ev.startsAt, ev.durationMin)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> {ev.durationMin} minutos · até {ev.capacity} participantes
          </p>
        </div>
        <Button variant="outline" onClick={copyInvite}>
          <Copy className="h-4 w-4" /> Copiar convite
        </Button>
      </div>

      {ev.description && (
        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950/50">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {ev.description}
          </p>
        </div>
      )}

      {/* ações */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {ev.cancelled ? (
          <Badge variant="outline" className="text-rose-600 dark:text-rose-400">
            Este evento foi cancelado pelo anfitrião
          </Badge>
        ) : ev.isParticipant ? (
          <>
            {canEnterRoom &&
              (roomOpen ? (
                inRoom ? null : (
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => setInRoom(true)}
                  >
                    <Video className="h-4 w-4" /> Entrar na sala ao vivo
                  </Button>
                )
              ) : (
                <Badge variant="outline" className="px-3 py-1.5">
                  A sala abre 15 minutos antes do horário
                </Badge>
              ))}
            {!ev.isHost && (
              <Button variant="ghost" disabled={busy} onClick={leave}>
                Sair do evento
              </Button>
            )}
          </>
        ) : ev.ended ? (
          <Badge variant="outline">Este evento já aconteceu</Badge>
        ) : (
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-500"
            disabled={busy || full}
            onClick={join}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : full ? (
              'Evento lotado'
            ) : (
              'Participar do evento'
            )}
          </Button>
        )}
        {ev.isHost && !ev.cancelled && (
          <Button
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400"
            disabled={busy}
            onClick={() => {
              if (window.confirm('Cancelar este evento? Os participantes serão avisados.')) void cancel()
            }}
          >
            Cancelar evento
          </Button>
        )}
      </div>

      {/* SALA AO VIVO (mesh) */}
      {inRoom && canEnterRoom && roomOpen && (
        <section aria-label="Sala de reunião ao vivo" className="mt-5">
          <EventStage eventId={ev.id} title={ev.title} />
        </section>
      )}

      {/* participantes + anfitrião */}
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <Card className="sm:col-span-2">
          <CardContent className="p-4 sm:p-6">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Participantes confirmados
              <span className="font-normal text-muted-foreground">
                ({ev.joinedCount}/{ev.capacity})
              </span>
            </p>
            {ev.participants.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Ninguém confirmou presença ainda.</p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {ev.participants.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2.5 rounded-xl border border-stone-200 p-2.5 dark:border-stone-800"
                  >
                    <Avatar name={p.name} size="sm" />
                    <span className="truncate text-sm font-semibold">{p.name}</span>
                    {p.role === 'HOST' && (
                      <Badge variant="outline" className="ml-auto shrink-0 border-amber-300 text-[10px] text-amber-700 dark:text-amber-300">
                        Anfitrião
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <Avatar name={ev.host.name} size="xl" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Anfitrião
              </p>
              <p className="font-bold">{ev.host.name}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ name: 'mentor', mentorId: ev.host.id })}
            >
              Ver perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/** O estágio de vídeo entra no bundle só quando a sala abre */
const EventStage = dynamic(
  () => import('@/components/platform/event-stage').then((m) => m.EventStage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[46vh] min-h-[300px] items-center justify-center rounded-2xl border border-stone-800 bg-stone-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    ),
  }
)
