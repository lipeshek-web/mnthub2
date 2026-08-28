'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarCheck2,
  CalendarOff,
  Clock3,
  FileText,
  Globe2,
  GraduationCap,
  ListVideo,
  MessageSquareQuote,
  PlayCircle,
  Presentation,
  Route,
  Star,
  UserRound,
  Video,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, Stars } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import {
  CONTENT_TYPE_META,
  LEVEL_LABELS,
  MONTHS_PT,
  WEEKDAYS_FULL_PT,
  WEEKDAYS_PT,
  addDays,
  addMinutesToTime,
  currencyBRL,
  dateKey,
  formatDayLabel,
  formatDayLabelLong,
  formatTimeLabel,
  hourToLabel,
  relativeDayLabel,
} from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import type { MentorDetailDTO } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const CONTENT_ICONS: Record<string, React.ElementType> = {
  ARTICLE: FileText,
  VIDEO: PlayCircle,
  WORKSHOP: Presentation,
  TRAIL: Route,
}

export function MentorProfileView({ mentorId }: { mentorId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const [mentor, setMentor] = useState<MentorDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setMentor(await api.getMentor(mentorId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !mentor) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <Card className="mx-auto max-w-md border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <CalendarOff className="h-10 w-10 text-stone-400" />
            <p className="font-semibold">{error ?? 'Mentor não encontrado'}</p>
            <Button onClick={() => navigate({ name: 'marketplace' })}>Voltar para mentores</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      <button
        onClick={() => navigate({ name: 'marketplace' })}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para mentores
      </button>

      {/* ---------- BANNER ---------- */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm" aria-label="Perfil do mentor">
        <div className="relative bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 pb-16 pt-8 sm:px-8">
          <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-2xl" />
          <div aria-hidden className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-teal-400/10 blur-xl" />
        </div>
        <div className="relative -mt-12 px-6 pb-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Avatar name={mentor.name} size="xl" className="shadow-lg" />
            <div className="flex-1 sm:pb-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
                {mentor.name}
              </h1>
              <p className="mt-0.5 text-sm font-medium text-stone-600">{mentor.headline}</p>
            </div>
            {mentor.rating > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 sm:mb-1">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <div>
                  <p className="text-lg font-extrabold leading-none text-stone-900">
                    {mentor.rating.toFixed(1)}
                  </p>
                  <p className="text-[11px] text-stone-500">{mentor.reviewCount} avaliações</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {mentor.categories.map((c) => (
              <Badge key={c} className="bg-emerald-700 font-medium text-white">
                {c}
              </Badge>
            ))}
            <Badge variant="outline" className="gap-1 border-stone-300 text-stone-600">
              <GraduationCap className="h-3.5 w-3.5" />{' '}
              {mentor.totalSessions === 1
                ? '1 sessão realizada'
                : `${mentor.totalSessions} sessões realizadas`}
            </Badge>
            <Badge variant="outline" className="gap-1 border-stone-300 text-stone-600">
              <Clock3 className="h-3.5 w-3.5" /> {mentor.experienceYears} anos de experiência
            </Badge>
            <Badge variant="outline" className="gap-1 border-stone-300 text-stone-600">
              <Globe2 className="h-3.5 w-3.5" /> {mentor.languages}
            </Badge>
            <Badge variant="outline" className="gap-1 border-stone-300 text-stone-600">
              <ListVideo className="h-3.5 w-3.5" /> {mentor.contents.length} conteúdos no mural
            </Badge>
          </div>
        </div>
      </section>

      {/* ---------- CONTEÚDO + AGENDAMENTO ---------- */}
      <div className="mt-7 grid gap-7 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="sobre">
            <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-stone-100 p-1">
              <TabsTrigger value="sobre" className="rounded-lg">Sobre</TabsTrigger>
              <TabsTrigger value="mural" className="rounded-lg">
                Mural de conteúdos ({mentor.contents.length})
              </TabsTrigger>
              <TabsTrigger value="horarios" className="rounded-lg">Horários</TabsTrigger>
              <TabsTrigger value="avaliacoes" className="rounded-lg">
                Avaliações ({mentor.reviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sobre" className="mt-5 space-y-5">
              <Card>
                <CardContent className="p-6">
                  <h2 className="flex items-center gap-2 font-bold">
                    <UserRound className="h-4.5 w-4.5 text-emerald-700" /> Sobre a mentoria
                  </h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">
                    {mentor.description}
                  </p>
                </CardContent>
              </Card>
              {mentor.bio && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-sm font-bold text-stone-900">Em resumo</h3>
                    <p className="mt-2 text-sm text-stone-600">{mentor.bio}</p>
                  </CardContent>
                </Card>
              )}
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Video, title: 'Reunião integrada', text: 'Sessão por vídeo aqui na própria plataforma.' },
                  { icon: CalendarCheck2, title: 'Agenda real', text: 'Horários atualizados pelo próprio mentor.' },
                  { icon: MessageSquareQuote, title: 'Método 1:1', text: 'Conversa focada nos seus objetivos.' },
                ].map((f) => (
                  <div key={f.title} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <f.icon className="h-5 w-5 text-emerald-700" />
                    <p className="mt-2 text-sm font-bold text-stone-800">{f.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{f.text}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mural" className="mt-5">
              {mentor.contents.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                    <ListVideo className="h-9 w-9 text-stone-300" />
                    <p className="text-sm text-muted-foreground">
                      Este mentor ainda não publicou conteúdos no mural.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {mentor.contents.map((c) => {
                    const Icon = CONTENT_ICONS[c.type] ?? BookOpenCheck
                    const meta = CONTENT_TYPE_META[c.type] ?? CONTENT_TYPE_META.ARTICLE
                    return (
                      <Card key={c.id} className="border-stone-200 transition-shadow hover:shadow-md">
                        <CardContent className="flex gap-4 p-5">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <Icon className="h-5.5 w-5.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={cn('border', meta.className)}>
                                {meta.label}
                              </Badge>
                              <Badge variant="outline" className="border-stone-200 text-stone-500">
                                {LEVEL_LABELS[c.level] ?? c.level}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{c.durationMin} min</span>
                            </div>
                            <h3 className="mt-2 font-bold text-stone-900">{c.title}</h3>
                            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-600">
                              {c.description}
                            </p>
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {c.tags.map((t) => (
                                <Badge key={t} variant="secondary" className="bg-stone-100 text-[11px] text-stone-600">
                                  #{t}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="horarios" className="mt-5">
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-bold">Disponibilidade semanal</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Horários livres são exibidos no widget de agendamento, no seu fuso local.
                  </p>
                  <div className="mt-4 space-y-2.5">
                    {WEEKDAYS_FULL_PT.map((dayName, weekday) => {
                      const ranges = mentor.availabilities.filter((a) => a.weekday === weekday)
                      return (
                        <div
                          key={dayName}
                          className={cn(
                            'flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center',
                            ranges.length > 0 ? 'border-stone-200 bg-white' : 'border-dashed border-stone-200 bg-stone-50'
                          )}
                        >
                          <p className="w-36 shrink-0 text-sm font-semibold text-stone-800">{dayName}</p>
                          {ranges.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {ranges.map((r) => (
                                <Badge key={r.id} className="bg-emerald-50 font-medium text-emerald-800">
                                  {hourToLabel(r.startHour)} – {hourToLabel(r.endHour)}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-stone-400">Indisponível</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="avaliacoes" className="mt-5 space-y-4">
              {mentor.reviews.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                    <Star className="h-9 w-9 text-stone-300" />
                    <p className="text-sm text-muted-foreground">
                      Ainda sem avaliações — seja o primeiro a mentorar com {mentor.name.split(' ')[0]}!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="border-emerald-100 bg-emerald-50/50">
                    <CardContent className="flex items-center gap-5 p-6">
                      <p className="text-4xl font-black text-stone-900">{mentor.rating.toFixed(1)}</p>
                      <div>
                        <Stars rating={mentor.rating} size={17} />
                        <p className="mt-1 text-xs text-stone-500">
                          Baseado em {mentor.reviewCount} avaliações de sessões reais
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  {mentor.reviews.map((r) => (
                    <Card key={r.id} className="border-stone-200">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.authorName} size="md" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-stone-900">{r.authorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDayLabel(r.createdAt.replace('T00:00:00.000Z', 'T12:00'))}
                            </p>
                          </div>
                          <Stars rating={r.rating} size={14} />
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-stone-600">{r.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingWidget mentor={mentor} />
        </aside>
      </div>
    </div>
  )
}

// ==================== WIDGET DE AGENDAMENTO ====================

function BookingWidget({ mentor }: { mentor: MentorDetailDTO }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)

  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()))
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadSlots = useCallback(async (date: string) => {
    setSlotsLoading(true)
    setSelectedSlot(null)
    try {
      const { slots } = await api.getSlots(mentor.id, date)
      setSlots(slots)
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [mentor.id])

  useEffect(() => {
    loadSlots(selectedDate)
  }, [loadSlots, selectedDate])

  const isOwner = user?.id === mentor.userId

  const submit = async () => {
    if (!user) {
      toast.error('Entre com um usuário no topo da página para agendar.')
      return
    }
    if (!selectedSlot) {
      toast.error('Escolha um horário disponível.')
      return
    }
    if (topic.trim().length < 5) {
      toast.error('Descreva o tema da sessão (mín. 5 caracteres).')
      return
    }
    setSubmitting(true)
    try {
      await api.createBooking({
        menteeId: user.id,
        mentorId: mentor.id,
        startsAt: selectedSlot,
        durationMin: 60,
        topic: topic.trim(),
        notes: notes.trim() || undefined,
      })
      toast.success('Solicitação enviada! O mentor confirmará em breve. 🎉')
      navigate({ name: 'dashboard' })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao agendar')
      loadSlots(selectedDate)
    } finally {
      setSubmitting(false)
      setConfirmOpen(false)
    }
  }

  if (isOwner) {
    return (
      <Card className="border-emerald-200">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <Avatar name={mentor.name} size="lg" />
          <p className="font-bold">Este é o seu perfil público de mentor</p>
          <p className="text-sm text-muted-foreground">
            Gerencie suas informações, agenda e mural de conteúdos.
          </p>
          <Button className="w-full" onClick={() => navigate({ name: 'onboarding' })}>
            Gerenciar meu perfil
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-stone-200 shadow-md">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-end justify-between">
          <p className="text-3xl font-black tracking-tight text-stone-900">
            {currencyBRL(mentor.hourlyRate)}
            <span className="text-sm font-medium text-muted-foreground"> / sessão</span>
          </p>
          <Badge variant="secondary" className="bg-stone-100 text-stone-600">60 min · vídeo</Badge>
        </div>

        {/* Dias */}
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Escolha o dia</Label>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1.5 [scrollbar-width:thin]">
            {days.map((d) => {
              const key = dateKey(d)
              const active = key === selectedDate
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  aria-pressed={active}
                  aria-label={`${WEEKDAYS_PT[d.getDay()]}, ${d.getDate()} de ${MONTHS_PT[d.getMonth()]}`}
                  className={cn(
                    'flex h-[62px] w-[52px] shrink-0 flex-col items-center justify-center rounded-xl border text-center transition-all',
                    active
                      ? 'border-emerald-700 bg-emerald-700 text-white shadow-md'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:bg-emerald-50'
                  )}
                >
                  <span className={cn('text-[10px] font-semibold uppercase', active ? 'text-emerald-200' : 'text-stone-400')}>
                    {WEEKDAYS_PT[d.getDay()]}
                  </span>
                  <span className="text-lg font-extrabold leading-tight">{d.getDate()}</span>
                  <span className={cn('text-[10px]', active ? 'text-emerald-200' : 'text-stone-400')}>
                    {MONTHS_PT[d.getMonth()]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Horários */}
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Horários livres · {formatDayLabel(`${selectedDate}T12:00`)}
          </Label>
          {slotsLoading ? (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
              <CalendarOff className="h-4 w-4 shrink-0" />
              Sem horários livres neste dia. Tente outra data.
            </div>
          ) : (
            <div className="mt-2 grid max-h-44 grid-cols-4 gap-2 overflow-y-auto pr-1">
              {slots.map((s) => {
                const active = s === selectedSlot
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedSlot(s)}
                    aria-pressed={active}
                    className={cn(
                      'h-10 rounded-lg border text-sm font-semibold transition-all',
                      active
                        ? 'border-emerald-700 bg-emerald-700 text-white shadow'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-emerald-400 hover:text-emerald-700'
                    )}
                  >
                    {formatTimeLabel(s)}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Resumo */}
        {selectedSlot && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm">
            <p className="font-bold text-emerald-900">{formatDayLabelLong(selectedSlot)}</p>
            <p className="mt-0.5 text-emerald-800">
              {formatTimeLabel(selectedSlot)} → {addMinutesToTime(selectedSlot, 60)} · {currencyBRL(mentor.hourlyRate)}
            </p>
          </div>
        )}

        {/* Tema */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="booking-topic">Tema da sessão *</Label>
            <Input
              id="booking-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex.: Revisão de portfólio e próximos passos"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="booking-notes">Observações (opcional)</Label>
            <Textarea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexto, links ou materiais para o mentor se preparar..."
              rows={2}
            />
          </div>
        </div>

        <Button
          className="h-11 w-full text-base font-bold"
          disabled={submitting}
          onClick={() => {
            if (!user) {
              toast.error('Entre com um usuário no topo da página para agendar.')
              return
            }
            setConfirmOpen(true)
          }}
        >
          {submitting ? 'Enviando...' : 'Solicitar agendamento'}
        </Button>
        <p className="-mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          A sessão nasce como solicitação e é confirmada pelo mentor. Acompanhe tudo em{' '}
          <strong>Minhas sessões</strong>.
        </p>
      </CardContent>

      {/* Confirmação */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar solicitação</DialogTitle>
            <DialogDescription>
              Revise os dados antes de enviar para {mentor.name.split(' ')[0]}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Mentor</span>
              <span className="font-semibold">{mentor.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Quando</span>
              <span className="text-right font-semibold">
                {selectedSlot && formatDayLabelLong(selectedSlot)}
                <br />
                {selectedSlot &&
                  `${formatTimeLabel(selectedSlot)} → ${addMinutesToTime(selectedSlot, 60)}`}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Tema</span>
              <span className="max-w-56 text-right font-semibold">{topic || '—'}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-stone-200 pt-2.5">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-extrabold text-emerald-700">{currencyBRL(mentor.hourlyRate)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Revisar
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar solicitação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
