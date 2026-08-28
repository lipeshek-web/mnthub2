'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  AtSign,
  BadgeDollarSign,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  Check,
  Clock,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  ListVideo,
  LogIn,
  Newspaper,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Stars } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import {
  CATEGORIES,
  CONTENT_TYPE_META,
  LEVEL_LABELS,
  WEEKDAYS_FULL_PT,
  currencyBRL,
  hourToLabel,
  labelToHour,
} from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import type {
  AvailabilitySlotInput,
  ContentPostDTO,
  CourseLessonDTO,
  CourseListItemDTO,
  MentorDetailDTO,
  SocialLinksDTO,
} from '@/lib/types'
import { cn } from '@/lib/utils'

// Horários de 30 em 30 min, de 06:00 a 21:30
const TIME_OPTIONS: string[] = (() => {
  const options: string[] = []
  for (let minutes = 6 * 60; minutes <= 21 * 60 + 30; minutes += 30) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return options
})()

const CONTENT_TYPES = ['ARTICLE', 'VIDEO', 'WORKSHOP', 'TRAIL'] as const
const CONTENT_LEVELS = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'] as const

// ---------- Formulário de perfil (criação e edição) ----------

export interface ProfileFormValues {
  headline: string
  description: string
  categories: string[]
  hourlyRate: number
  experienceYears: number
  languages: string
  socials: SocialLinksDTO
}

interface ProfileFormErrors {
  headline?: string
  description?: string
  categories?: string
  hourlyRate?: string
  experienceYears?: string
}

function MentorProfileForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: ProfileFormValues
  submitLabel: string
  onSubmit: (values: ProfileFormValues) => Promise<void>
}) {
  const [headline, setHeadline] = useState(initial?.headline ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [categories, setCategories] = useState<string[]>(initial?.categories ?? [])
  const [hourlyRate, setHourlyRate] = useState(initial ? String(initial.hourlyRate) : '')
  const [experienceYears, setExperienceYears] = useState(initial ? String(initial.experienceYears) : '')
  const [languages, setLanguages] = useState(initial?.languages || 'Português')
  const [instagram, setInstagram] = useState(initial?.socials?.instagram ?? '')
  const [linkedin, setLinkedin] = useState(initial?.socials?.linkedin ?? '')
  const [github, setGithub] = useState(initial?.socials?.github ?? '')
  const [website, setWebsite] = useState(initial?.socials?.website ?? '')
  const [errors, setErrors] = useState<ProfileFormErrors>({})
  const [saving, setSaving] = useState(false)

  const toggleCategory = (category: string) => {
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
    setErrors((prev) => ({ ...prev, categories: undefined }))
  }

  const validate = (): ProfileFormErrors => {
    const errs: ProfileFormErrors = {}
    if (headline.trim().length < 8) {
      errs.headline = 'O título deve ter pelo menos 8 caracteres.'
    }
    if (description.trim().length < 30) {
      errs.description = 'Descreva sua mentoria com pelo menos 30 caracteres.'
    }
    if (categories.length === 0) {
      errs.categories = 'Selecione pelo menos uma categoria.'
    }
    const rate = Number(hourlyRate)
    if (hourlyRate.trim() === '' || Number.isNaN(rate) || rate < 0) {
      errs.hourlyRate = 'Informe um valor válido por hora (maior ou igual a zero).'
    }
    const years = Number(experienceYears)
    if (experienceYears.trim() === '' || Number.isNaN(years) || years < 0) {
      errs.experienceYears = 'Informe seus anos de experiência.'
    }
    return errs
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return
    setSaving(true)
    try {
      await onSubmit({
        headline: headline.trim(),
        description: description.trim(),
        categories,
        hourlyRate: Number(hourlyRate),
        experienceYears: Number(experienceYears),
        languages: languages.trim() || 'Português',
        socials: {
          instagram: instagram.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          github: github.trim() || undefined,
          website: website.trim() || undefined,
        },
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="mentor-headline">Título profissional</Label>
        <Input
          id="mentor-headline"
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
          placeholder="Ex.: Engenheiro de Software Sênior · Ex-Nubank"
          aria-invalid={Boolean(errors.headline)}
        />
        {errors.headline ? (
          <p className="text-xs text-rose-600">{errors.headline}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Uma frase curta que resume quem você é e o que faz.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="mentor-description">Como funciona sua mentoria</Label>
        <Textarea
          id="mentor-description"
          rows={6}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Conte como você trabalha: o que o aluno recebe, como são as sessões e quais resultados você pode ajudar a alcançar..."
          aria-invalid={Boolean(errors.description)}
        />
        {errors.description ? (
          <p className="text-xs text-rose-600">{errors.description}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Detalhe sua metodologia, público ideal e o que o aluno leva de cada sessão (mínimo 30 caracteres).
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Áreas de atuação</Label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorias de atuação">
          {CATEGORIES.map((category) => {
            const selected = categories.includes(category)
            return (
              <button
                key={category}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleCategory(category)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600',
                  selected
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-stone-300 bg-white text-stone-700 hover:border-emerald-400 hover:text-emerald-700'
                )}
              >
                {category}
              </button>
            )
          })}
        </div>
        {errors.categories ? <p className="text-xs text-rose-600">{errors.categories}</p> : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="mentor-rate">Valor da hora</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              id="mentor-rate"
              type="number"
              min={0}
              step={10}
              className="pl-10"
              value={hourlyRate}
              onChange={(event) => setHourlyRate(event.target.value)}
              placeholder="150"
              aria-invalid={Boolean(errors.hourlyRate)}
            />
          </div>
          {errors.hourlyRate ? (
            <p className="text-xs text-rose-600">{errors.hourlyRate}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Valor por sessão de 1 hora. Você pode ajustar depois.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="mentor-experience">Anos de experiência</Label>
          <Input
            id="mentor-experience"
            type="number"
            min={0}
            step={1}
            value={experienceYears}
            onChange={(event) => setExperienceYears(event.target.value)}
            placeholder="8"
            aria-invalid={Boolean(errors.experienceYears)}
          />
          {errors.experienceYears ? (
            <p className="text-xs text-rose-600">{errors.experienceYears}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Tempo total de atuação na área.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="mentor-languages">Idiomas</Label>
        <Input
          id="mentor-languages"
          value={languages}
          onChange={(event) => setLanguages(event.target.value)}
          placeholder="Português"
        />
        <p className="text-xs text-muted-foreground">Idiomas em que você pode mentorar, separados por vírgula.</p>
      </div>

      {/* Redes sociais e portfólio (opcional) */}
      <div className="flex flex-col gap-4 border-t border-stone-100 pt-5">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <AtSign className="size-4 text-emerald-700" aria-hidden /> Redes sociais e portfólio
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Aparecem como cartões de prévia no seu perfil público.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="social-instagram">Instagram</Label>
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                @
              </span>
              <Input
                id="social-instagram"
                className="pl-8"
                value={instagram}
                onChange={(event) => setInstagram(event.target.value)}
                placeholder="seu.usuario"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="social-linkedin">LinkedIn</Label>
            <Input
              id="social-linkedin"
              value={linkedin}
              onChange={(event) => setLinkedin(event.target.value)}
              placeholder="https://linkedin.com/in/voce"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="social-github">GitHub</Label>
            <Input
              id="social-github"
              value={github}
              onChange={(event) => setGithub(event.target.value)}
              placeholder="seu.usuario"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="social-website">Site / Portfólio</Label>
            <Input
              id="social-website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://seusite.com.br"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="min-w-44">
          {saving ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

// ---------- Editor de disponibilidade semanal ----------

function AvailabilityEditor({
  initialSlots,
  onSave,
}: {
  initialSlots: AvailabilitySlotInput[]
  onSave: (slots: AvailabilitySlotInput[]) => Promise<void>
}) {
  const [slots, setSlots] = useState<AvailabilitySlotInput[]>(() =>
    [...initialSlots].sort((a, b) => a.weekday - b.weekday || a.startHour - b.startHour)
  )
  const [addingDay, setAddingDay] = useState<number | null>(null)
  const [newStart, setNewStart] = useState('09:00')
  const [newEnd, setNewEnd] = useState('12:00')
  const [saving, setSaving] = useState(false)

  const openAdd = (weekday: number) => {
    setAddingDay(weekday)
    setNewStart('09:00')
    setNewEnd('12:00')
  }

  const removeSlot = (weekday: number, startHour: number, endHour: number) => {
    setSlots((prev) =>
      prev.filter((s) => !(s.weekday === weekday && s.startHour === startHour && s.endHour === endHour))
    )
  }

  const confirmAdd = () => {
    if (addingDay === null) return
    const startHour = labelToHour(newStart)
    const endHour = labelToHour(newEnd)
    if (endHour - startHour < 1) {
      toast.error('A faixa de horário deve ter pelo menos 1 hora de duração.')
      return
    }
    const conflicts = slots.some(
      (s) => s.weekday === addingDay && startHour < s.endHour && endHour > s.startHour
    )
    if (conflicts) {
      toast.error('Esta faixa conflita com um horário já cadastrado neste dia.')
      return
    }
    setSlots((prev) => [...prev, { weekday: addingDay, startHour, endHour }])
    setAddingDay(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const ordered = [...slots].sort((a, b) => a.weekday - b.weekday || a.startHour - b.startHour)
      await onSave(ordered)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col divide-y divide-stone-200 rounded-lg border border-stone-200">
        {WEEKDAYS_FULL_PT.map((day, weekday) => {
          const daySlots = slots
            .filter((s) => s.weekday === weekday)
            .sort((a, b) => a.startHour - b.startHour)
          return (
            <div key={day} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <span className="w-28 shrink-0 text-sm font-medium sm:w-32">{day}</span>
                {daySlots.length === 0 ? (
                  <span className="text-xs text-stone-400">Sem disponibilidade</span>
                ) : (
                  <span className="flex flex-wrap items-center gap-1.5">
                    {daySlots.map((s) => (
                      <Badge
                        key={`${s.weekday}-${s.startHour}-${s.endHour}`}
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 py-1 text-emerald-800"
                      >
                        {hourToLabel(s.startHour)} – {hourToLabel(s.endHour)}
                        <button
                          type="button"
                          aria-label={`Remover faixa de ${hourToLabel(s.startHour)} às ${hourToLabel(
                            s.endHour
                          )} na ${day.toLowerCase()}`}
                          onClick={() => removeSlot(s.weekday, s.startHour, s.endHour)}
                          className="rounded-full p-0.5 transition-colors hover:bg-emerald-200/70 focus-visible:outline-2 focus-visible:outline-emerald-600"
                        >
                          <X className="size-3" aria-hidden />
                        </button>
                      </Badge>
                    ))}
                  </span>
                )}
              </div>

              <div className="shrink-0">
                {addingDay === weekday ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={newStart} onValueChange={setNewStart}>
                      <SelectTrigger size="sm" className="w-24" aria-label="Início da faixa">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground" aria-hidden>
                      →
                    </span>
                    <Select value={newEnd} onValueChange={setNewEnd}>
                      <SelectTrigger size="sm" className="w-24" aria-label="Fim da faixa">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={confirmAdd}>
                      <Check className="size-4" aria-hidden /> Confirmar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddingDay(null)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openAdd(weekday)}
                    aria-label={`Adicionar faixa de horário na ${day.toLowerCase()}`}
                  >
                    <Plus className="size-4" aria-hidden /> Adicionar
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Alunos só podem agendar dentro destas faixas. Use intervalos de pelo menos 1 hora.
        </p>
        <Button onClick={() => void handleSave()} disabled={saving} className="shrink-0">
          <Save className="size-4" aria-hidden /> {saving ? 'Salvando...' : 'Salvar disponibilidade'}
        </Button>
      </div>
    </div>
  )
}

// ---------- Gerenciador do mural de conteúdos ----------

function ContentsManager({
  contents,
  userId,
  onChanged,
}: {
  contents: ContentPostDTO[]
  userId: string
  onChanged: () => Promise<void>
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ContentPostDTO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<string>('ARTICLE')
  const [level, setLevel] = useState<string>('INICIANTE')
  const [durationMin, setDurationMin] = useState('45')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    title?: string
    description?: string
    durationMin?: string
  }>({})

  const handleCreate = async () => {
    const errs: typeof formErrors = {}
    if (title.trim().length < 3) {
      errs.title = 'Dê um título ao conteúdo (mínimo 3 caracteres).'
    }
    if (description.trim().length < 10) {
      errs.description = 'Escreva uma breve descrição (mínimo 10 caracteres).'
    }
    const duration = Number(durationMin)
    if (durationMin.trim() === '' || Number.isNaN(duration) || duration <= 0) {
      errs.durationMin = 'Informe a duração em minutos.'
    }
    setFormErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      await api.createContent({
        userId,
        title: title.trim(),
        description: description.trim(),
        type,
        level,
        durationMin: duration,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      })
      toast.success('Conteúdo publicado no mural!')
      setCreateOpen(false)
      setTitle('')
      setDescription('')
      setType('ARTICLE')
      setLevel('INICIANTE')
      setDurationMin('45')
      setTags('')
      await onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível publicar o conteúdo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.deleteContent(toDelete.id, userId)
      toast.success('Conteúdo removido do mural.')
      setToDelete(null)
      await onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover o conteúdo.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <Newspaper className="size-4" aria-hidden />
          </span>
          Mural de conteúdos
        </CardTitle>
        <CardDescription>
          Publique artigos, vídeos, workshops e trilhas para mostrar sua expertise e atrair mais alunos.
        </CardDescription>
        <CardAction>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden /> Novo conteúdo
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {contents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-stone-300 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 ring-1 ring-stone-200">
              <BookOpen className="size-6" aria-hidden />
            </div>
            <h3 className="mt-2 text-base font-semibold">Nenhum conteúdo no mural</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Compartilhe artigos, vídeos e trilhas para demonstrar sua experiência antes mesmo da primeira
              sessão.
            </p>
          </div>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar]:w-1.5">
            {contents.map((content) => {
              const meta = CONTENT_TYPE_META[content.type]
              return (
                <div
                  key={content.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {meta ? (
                        <Badge variant="outline" className={meta.className}>
                          {meta.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{content.type}</Badge>
                      )}
                      <span className="text-sm text-stone-500">
                        {LEVEL_LABELS[content.level] ?? content.level}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-stone-500">
                        <Clock className="size-3.5" aria-hidden /> {content.durationMin} min
                      </span>
                    </div>
                    <h4 className="mt-2 font-semibold leading-snug">{content.title}</h4>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{content.description}</p>
                    {content.tags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {content.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-stone-500">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Excluir conteúdo ${content.title}`}
                    onClick={() => setToDelete(content)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Dialog: novo conteúdo */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (open) setFormErrors({})
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo conteúdo</DialogTitle>
            <DialogDescription>
              Publique um conteúdo no seu mural para demonstrar sua expertise aos alunos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="content-title">Título</Label>
              <Input
                id="content-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Como estruturar a arquitetura frontend de um produto"
                aria-invalid={Boolean(formErrors.title)}
              />
              {formErrors.title ? <p className="text-xs text-rose-600">{formErrors.title}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="content-description">Descrição</Label>
              <Textarea
                id="content-description"
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Do que se trata e o que o aluno vai aprender com este conteúdo..."
                aria-invalid={Boolean(formErrors.description)}
              />
              {formErrors.description ? (
                <p className="text-xs text-rose-600">{formErrors.description}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="content-type">Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="content-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {CONTENT_TYPE_META[t]?.label ?? t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="content-level">Nível</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger id="content-level" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {LEVEL_LABELS[l] ?? l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="content-duration">Duração (min)</Label>
                <Input
                  id="content-duration"
                  type="number"
                  min={5}
                  step={5}
                  value={durationMin}
                  onChange={(event) => setDurationMin(event.target.value)}
                  aria-invalid={Boolean(formErrors.durationMin)}
                />
                {formErrors.durationMin ? (
                  <p className="text-xs text-rose-600">{formErrors.durationMin}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="content-tags">Tags</Label>
                <Input
                  id="content-tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="react, arquitetura (separe por vírgula)"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreate()} disabled={saving}>
              {saving ? 'Publicando...' : 'Publicar conteúdo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: excluir conteúdo */}
      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conteúdo?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.title}&quot; será removido do mural permanentemente. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// ---------- Gerenciador de cursos ----------

interface CourseFormErrors {
  title?: string
  description?: string
  category?: string
  price?: string
}

function CoursesManager({ userId, onChanged }: { userId: string; onChanged: () => Promise<void> }) {
  const [courses, setCourses] = useState<CourseListItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CourseListItemDTO | null>(null)
  const [toDelete, setToDelete] = useState<CourseListItemDTO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [lessonsCourse, setLessonsCourse] = useState<CourseListItemDTO | null>(null)
  const [lessonsOpen, setLessonsOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [level, setLevel] = useState<string>('INICIANTE')
  const [price, setPrice] = useState('0')
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<CourseFormErrors>({})

  const fetchCourses = useCallback(async (): Promise<CourseListItemDTO[]> => {
    const list = await api.listCourses({ mentorUserId: userId })
    setCourses(list)
    return list
  }, [userId])

  useEffect(() => {
    let active = true
    fetchCourses()
      .catch((err: unknown) => {
        if (active) {
          toast.error(err instanceof Error ? err.message : 'Não foi possível carregar seus cursos.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [fetchCourses])

  /** Recarrega os cursos locais e os dados do perfil (contagens) no pai */
  const refreshAll = useCallback(async () => {
    await Promise.all([onChanged(), fetchCourses()])
  }, [onChanged, fetchCourses])

  const openCreate = () => {
    setEditing(null)
    setTitle('')
    setDescription('')
    setCategory('')
    setLevel('INICIANTE')
    setPrice('0')
    setFormErrors({})
    setDialogOpen(true)
  }

  const openEdit = (course: CourseListItemDTO) => {
    setEditing(course)
    setTitle(course.title)
    setDescription(course.description)
    setCategory(course.category)
    setLevel(course.level)
    setPrice(String(course.price))
    setFormErrors({})
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    const errs: CourseFormErrors = {}
    if (title.trim().length < 5) {
      errs.title = 'O título do curso precisa de ao menos 5 caracteres.'
    }
    if (description.trim().length < 30) {
      errs.description = 'Descreva o curso com pelo menos 30 caracteres.'
    }
    if (!category) {
      errs.category = 'Selecione a categoria do curso.'
    }
    const priceNum = Number(price)
    if (price.trim() === '' || Number.isNaN(priceNum) || priceNum < 0) {
      errs.price = 'Informe um preço válido (0 = gratuito).'
    }
    setFormErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      if (editing) {
        await api.updateCourse(editing.id, {
          userId,
          title: title.trim(),
          description: description.trim(),
          category,
          level,
          price: priceNum,
        })
        toast.success('Curso atualizado!')
        setDialogOpen(false)
        await refreshAll()
      } else {
        const created = await api.createCourse({
          userId,
          title: title.trim(),
          description: description.trim(),
          category,
          level,
          price: priceNum,
        })
        toast.success('Curso criado! Agora adicione aulas.')
        setDialogOpen(false)
        const [, list] = await Promise.all([onChanged(), fetchCourses()])
        const fresh = list.find((c) => c.id === created.id) ?? null
        if (fresh) {
          setLessonsCourse(fresh)
          setLessonsOpen(true)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o curso.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (course: CourseListItemDTO) => {
    setTogglingId(course.id)
    try {
      await api.updateCourse(course.id, { userId, isPublished: !course.isPublished })
      toast.success(
        course.isPublished ? 'Curso movido para rascunho.' : 'Curso publicado! Ele já aparece no Explorar.'
      )
      await refreshAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar o curso.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.deleteCourse(toDelete.id, userId)
      toast.success('Curso excluído.')
      setToDelete(null)
      await refreshAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir o curso.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <GraduationCap className="size-4" aria-hidden />
          </span>
          Meus cursos
        </CardTitle>
        <CardDescription>
          Crie cursos com aulas em vídeo ou texto e publique para os alunos se matricularem.
        </CardDescription>
        <CardAction>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" aria-hidden /> Novo curso
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-stone-300 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 ring-1 ring-stone-200">
              <GraduationCap className="size-6" aria-hidden />
            </div>
            <h3 className="mt-2 text-base font-semibold">Nenhum curso criado</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Estruture suas aulas em um curso — em vídeo ou texto — e publique quando estiver pronto.
            </p>
          </div>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar]:w-1.5">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-stone-200 text-stone-600">
                      {course.category}
                    </Badge>
                    <Badge variant="outline" className="border-stone-200 text-stone-500">
                      {LEVEL_LABELS[course.level] ?? course.level}
                    </Badge>
                    {course.isPublished ? (
                      <Badge className="bg-emerald-100 text-emerald-800">Publicado</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-stone-100 text-stone-600">
                        Rascunho
                      </Badge>
                    )}
                  </div>
                  <h4 className="mt-2 font-semibold leading-snug">{course.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {course.lessonCount} {course.lessonCount === 1 ? 'aula' : 'aulas'} ·{' '}
                    {course.price === 0 ? 'Gratuito' : currencyBRL(course.price)} · {course.studentCount}{' '}
                    {course.studentCount === 1 ? 'aluno' : 'alunos'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-stone-600"
                    aria-label={`Gerenciar aulas de ${course.title}`}
                    onClick={() => {
                      setLessonsCourse(course)
                      setLessonsOpen(true)
                    }}
                  >
                    <ListVideo className="size-4" aria-hidden /> Aulas
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar curso ${course.title}`}
                    onClick={() => openEdit(course)}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={togglingId === course.id}
                    aria-label={
                      course.isPublished ? `Despublicar curso ${course.title}` : `Publicar curso ${course.title}`
                    }
                    onClick={() => void togglePublish(course)}
                  >
                    {course.isPublished ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Excluir curso ${course.title}`}
                    onClick={() => setToDelete(course)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog: novo/editar curso */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (open) setFormErrors({})
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar curso' : 'Novo curso'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize as informações do curso. As aulas são gerenciadas separadamente.'
                : 'Crie a estrutura do curso. Depois de salvar, você adiciona as aulas.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="course-title">Título</Label>
              <Input
                id="course-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Arquitetura de Software na prática"
                aria-invalid={Boolean(formErrors.title)}
              />
              {formErrors.title ? <p className="text-xs text-rose-600">{formErrors.title}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="course-description">Descrição</Label>
              <Textarea
                id="course-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="O que o aluno vai aprender e para quem é o curso..."
                aria-invalid={Boolean(formErrors.description)}
              />
              {formErrors.description ? (
                <p className="text-xs text-rose-600">{formErrors.description}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="course-category">Categoria</Label>
                <Select
                  value={category}
                  onValueChange={(value) => {
                    setCategory(value)
                    setFormErrors((prev) => ({ ...prev, category: undefined }))
                  }}
                >
                  <SelectTrigger id="course-category" className="w-full" aria-invalid={Boolean(formErrors.category)}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category ? <p className="text-xs text-rose-600">{formErrors.category}</p> : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="course-level">Nível</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger id="course-level" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {LEVEL_LABELS[l] ?? l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="course-price">Preço (R$)</Label>
              <Input
                id="course-price"
                type="number"
                min={0}
                step={10}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                aria-invalid={Boolean(formErrors.price)}
              />
              {formErrors.price ? (
                <p className="text-xs text-rose-600">{formErrors.price}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Deixe 0 para tornar o curso gratuito.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar curso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: aulas do curso */}
      {lessonsCourse && (
        <LessonsManagerDialog
          course={lessonsCourse}
          userId={userId}
          open={lessonsOpen}
          onOpenChange={setLessonsOpen}
          onChanged={refreshAll}
        />
      )}

      {/* AlertDialog: excluir curso */}
      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir curso?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.title}&quot; remove o curso, todas as aulas e o progresso dos alunos
              permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// ---------- Dialog de aulas do curso ----------

interface LessonFormErrors {
  title?: string
  durationMin?: string
  material?: string
}

function LessonsManagerDialog({
  course,
  userId,
  open,
  onOpenChange,
  onChanged,
}: {
  course: CourseListItemDTO
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => Promise<void>
}) {
  const [lessons, setLessons] = useState<CourseLessonDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [durationMin, setDurationMin] = useState('15')
  const [videoUrl, setVideoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<LessonFormErrors>({})

  const fetchLessons = useCallback(async () => {
    const detail = await api.getCourse(course.id)
    setLessons(detail.lessons)
  }, [course.id])

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    setAdding(false)
    setTitle('')
    setDurationMin('15')
    setVideoUrl('')
    setDescription('')
    setContent('')
    setFormErrors({})
    fetchLessons()
      .catch((err: unknown) => {
        if (active) {
          toast.error(err instanceof Error ? err.message : 'Não foi possível carregar as aulas.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, fetchLessons])

  const handleAdd = async () => {
    const errs: LessonFormErrors = {}
    if (title.trim().length < 3) {
      errs.title = 'Dê um título à aula (mínimo 3 caracteres).'
    }
    const duration = Number(durationMin)
    if (durationMin.trim() === '' || Number.isNaN(duration) || duration <= 0) {
      errs.durationMin = 'Informe a duração em minutos.'
    }
    if (!videoUrl.trim() && !content.trim()) {
      errs.material = 'A aula precisa de um vídeo ou de conteúdo textual.'
    }
    setFormErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      await api.createLesson(course.id, {
        userId,
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        content: content.trim() || undefined,
        durationMin: duration,
      })
      toast.success('Aula adicionada!')
      setTitle('')
      setDurationMin('15')
      setVideoUrl('')
      setDescription('')
      setContent('')
      setAdding(false)
      await Promise.all([fetchLessons(), onChanged()])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível adicionar a aula.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLesson = async (lesson: CourseLessonDTO) => {
    try {
      await api.deleteLesson(course.id, lesson.id, userId)
      toast.success('Aula removida.')
      await Promise.all([fetchLessons(), onChanged()])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover a aula.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aulas do curso</DialogTitle>
          <DialogDescription>
            {course.title} · {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'} — exibidas nesta ordem
            para os alunos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          ) : lessons.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 py-6 text-center text-sm text-muted-foreground">
              Nenhuma aula ainda — adicione a primeira abaixo.
            </p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar]:w-1.5">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2.5"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-600">
                    {lesson.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{lesson.title}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {lesson.videoUrl ? (
                        <Video className="size-3" aria-hidden />
                      ) : (
                        <FileText className="size-3" aria-hidden />
                      )}
                      {lesson.durationMin} min
                      {lesson.videoUrl ? ' · Vídeo' : lesson.content ? ' · Texto' : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remover aula ${lesson.title}`}
                    onClick={() => void handleDeleteLesson(lesson)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {adding ? (
            <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="lesson-title">Título</Label>
                <Input
                  id="lesson-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Boas-vindas e visão geral"
                  aria-invalid={Boolean(formErrors.title)}
                />
                {formErrors.title ? <p className="text-xs text-rose-600">{formErrors.title}</p> : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lesson-duration">Duração (min)</Label>
                  <Input
                    id="lesson-duration"
                    type="number"
                    min={1}
                    step={5}
                    value={durationMin}
                    onChange={(event) => setDurationMin(event.target.value)}
                    aria-invalid={Boolean(formErrors.durationMin)}
                  />
                  {formErrors.durationMin ? (
                    <p className="text-xs text-rose-600">{formErrors.durationMin}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lesson-video">Vídeo (URL opcional)</Label>
                  <Input
                    id="lesson-video"
                    value={videoUrl}
                    onChange={(event) => setVideoUrl(event.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lesson-content">Conteúdo textual (opcional)</Label>
                <Textarea
                  id="lesson-content"
                  rows={3}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Cole aqui o material da aula ou escreva o conteúdo..."
                  aria-invalid={Boolean(formErrors.material)}
                />
                {formErrors.material ? (
                  <p className="text-xs text-rose-600">{formErrors.material}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lesson-description">Resumo (opcional)</Label>
                <Input
                  id="lesson-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Resumo curto da aula"
                  autoComplete="off"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAdding(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={() => void handleAdd()} disabled={saving}>
                  {saving ? 'Adicionando...' : 'Adicionar aula'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={() => setAdding(true)}
            >
              <Plus className="size-4" aria-hidden /> Adicionar aula
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Componentes de apresentação ----------

function BenefitCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <Card className="p-6 text-left">
      <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </Card>
  )
}

// ---------- View principal ----------

export default function OnboardingView() {
  const user = useAppStore((state) => state.user)
  const userId = user?.id ?? null

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<MentorDetailDTO | null>(null)

  const reload = useCallback(async () => {
    if (!userId) return
    try {
      const res = await api.getMyMentorProfile(userId)
      setProfile(res.profile)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar seu perfil de mentor.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    void reload()
  }, [userId, reload])

  const handleCreateProfile = useCallback(
    async (values: ProfileFormValues) => {
      if (!user) return
      await api.saveMentorProfile({ userId: user.id, ...values })
      toast.success('Perfil publicado! Você já aparece no marketplace.')
      await reload()
    },
    [user, reload]
  )

  const handleUpdateProfile = useCallback(
    async (values: ProfileFormValues) => {
      if (!user) return
      await api.saveMentorProfile({ userId: user.id, ...values })
      toast.success('Alterações salvas com sucesso!')
      await reload()
    },
    [user, reload]
  )

  const handleSaveAvailability = useCallback(
    async (slots: AvailabilitySlotInput[]) => {
      if (!user) return
      try {
        await api.saveAvailability({ userId: user.id, slots })
        toast.success('Agenda atualizada!')
        await reload()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível salvar sua disponibilidade.')
      }
    },
    [user, reload]
  )

  // ---------- Guardas de render ----------

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
              <LogIn className="size-6" aria-hidden />
            </div>
            <h1 className="text-xl font-semibold">Entre para configurar seu perfil de mentor</h1>
            <p className="max-w-xs text-sm text-muted-foreground">
              Selecione um usuário no seletor do topo da página para criar ou editar seu perfil de mentor.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="size-14 rounded-2xl" />
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  // ---------- Sem perfil: apresentação + criação ----------

  if (!profile) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
        <section className="text-center" aria-labelledby="onboarding-hero-title">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <Sparkles className="size-7" aria-hidden />
          </div>
          <h1 id="onboarding-hero-title" className="mt-4 text-3xl font-bold tracking-tight">
            Torne-se um mentor no MentorHub
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Compartilhe sua experiência com quem está começando, construa sua reputação e seja remunerado por
            cada sessão de mentoria.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <BenefitCard
              icon={BadgeDollarSign}
              title="Receba pela sua hora"
              text="Defina quanto vale a sua hora e receba por cada sessão de mentoria realizada."
            />
            <BenefitCard
              icon={Users}
              title="Encontre alunos"
              text="Seu perfil entra no marketplace e alunos em busca de crescimento encontram você."
            />
            <BenefitCard
              icon={CalendarCheck}
              title="Agenda organizada"
              text="Cadastre sua disponibilidade semanal e receba solicitações apenas nos horários livres."
            />
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Crie seu perfil de mentor</CardTitle>
            <CardDescription>
              Preencha as informações abaixo — elas serão exibidas para os alunos no marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MentorProfileForm submitLabel="Publicar meu perfil" onSubmit={handleCreateProfile} />
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---------- Com perfil: perfil público + disponibilidade + mural ----------

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Painel do mentor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seu perfil público, sua agenda semanal, os conteúdos do mural e seus cursos.
        </p>
      </header>

      {/* 1. Perfil público */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <UserRound className="size-4" aria-hidden />
            </span>
            Perfil público
          </CardTitle>
          <CardDescription>Estas informações aparecem para os alunos no marketplace.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg bg-stone-50 p-4 ring-1 ring-stone-200">
            <div className="flex items-center gap-2">
              <Stars rating={profile.rating} size={16} />
              <span className="text-sm font-semibold">
                {profile.rating > 0 ? profile.rating.toFixed(1).replace('.', ',') : '—'}
              </span>
              <span className="text-sm text-muted-foreground">de avaliação</span>
            </div>
            <Separator orientation="vertical" className="hidden h-8 sm:block" />
            <div className="text-sm">
              <span className="font-semibold">{profile.reviewCount}</span>{' '}
              <span className="text-muted-foreground">
                {profile.reviewCount === 1 ? 'avaliação' : 'avaliações'}
              </span>
            </div>
            <Separator orientation="vertical" className="hidden h-8 sm:block" />
            <div className="text-sm">
              <span className="font-semibold">{profile.contents.length}</span>{' '}
              <span className="text-muted-foreground">
                {profile.contents.length === 1 ? 'conteúdo no mural' : 'conteúdos no mural'}
              </span>
            </div>
          </div>

          <MentorProfileForm
            initial={{
              headline: profile.headline,
              description: profile.description,
              categories: profile.categories,
              hourlyRate: profile.hourlyRate,
              experienceYears: profile.experienceYears,
              languages: profile.languages,
              socials: profile.socials ?? {},
            }}
            submitLabel="Salvar alterações"
            onSubmit={handleUpdateProfile}
          />
        </CardContent>
      </Card>

      {/* 2. Disponibilidade semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <CalendarClock className="size-4" aria-hidden />
            </span>
            Disponibilidade semanal
          </CardTitle>
          <CardDescription>
            Defina as faixas de horário em que os alunos podem agendar sessões com você.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityEditor initialSlots={profile.availabilities} onSave={handleSaveAvailability} />
        </CardContent>
      </Card>

      {/* 3. Mural de conteúdos */}
      <ContentsManager contents={profile.contents} userId={user.id} onChanged={reload} />

      {/* 4. Cursos */}
      <CoursesManager userId={user.id} onChanged={reload} />
    </div>
  )
}
