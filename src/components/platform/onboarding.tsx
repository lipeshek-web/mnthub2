'use client'

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  AtSign,
  BadgeCheck,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  FolderInput,
  GraduationCap,
  ImagePlus,
  LayoutDashboard,
  Library,
  Link2,
  ListChecks,
  ListVideo,
  LogIn,
  Megaphone,
  Newspaper,
  Paperclip,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Route,
  Save,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Type,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, Stars } from '@/components/platform/avatar'
import { LibraryManager } from './library-manager'
import { TracksManager } from './tracks-manager'
import { api } from '@/lib/api'
import {
  MENTOR_FONT_CATEGORIES,
  MENTOR_FONTS,
  bodyFontStyle,
  fontPreviewStyle,
  getMentorFont,
  headingFontStyle,
  type MentorFont,
  type MentorFontCategory,
} from '@/lib/fonts'
import {
  CATEGORIES,
  CONTENT_TYPE_META,
  LEVEL_LABELS,
  WEEKDAYS_FULL_PT,
  avatarGradient,
  currencyBRL,
  firstName,
  formatDayLabel,
  formatTimeLabel,
  hourToLabel,
  labelToHour,
} from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import { buildCourseUrl, buildMentorLpUrl } from '@/lib/tracking'
import type {
  AvailabilitySlotInput,
  ContentPostDTO,
  CourseLessonDTO,
  CourseListItemDTO,
  CourseThemeDTO,
  LibraryItemDTO,
  LessonAttachmentDTO,
  MentorDetailDTO,
  QuizDTO,
  SocialLinksDTO,
  TrackingStatsDTO,
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

// ---------- Upload de imagens e clipboard (fotos e links rastreáveis) ----------

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** Valida o tamanho (máx. 5MB), envia o arquivo e devolve a URL — falhas são exibidas via toast */
async function uploadImageFile(file: File | null | undefined): Promise<string | null> {
  if (!file) return null
  if (file.size > MAX_IMAGE_BYTES) {
    toast.error('A imagem deve ter no máximo 5MB.')
    return null
  }
  try {
    return await api.uploadImage(file)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Não foi possível enviar a imagem.')
    return null
  }
}

function copyToClipboard(text: string, successMessage = 'Link copiado!') {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    toast.error('Não foi possível copiar o link.')
    return
  }
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(successMessage))
    .catch(() => toast.error('Não foi possível copiar o link.'))
}

// ---------- Seletor de fontes do criador ----------

const FONT_SLOT_LABELS = {
  heading: 'Nome e títulos',
  body: 'Descrições e textos',
} as const
type FontSlot = keyof typeof FONT_SLOT_LABELS

/** Card individual de fonte do catálogo */
function FontOptionCard({
  font,
  activeHeading,
  activeBody,
  onSelect,
}: {
  font: MentorFont
  activeHeading: boolean
  activeBody: boolean
  onSelect: () => void
}) {
  const active = activeHeading || activeBody
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Selecionar fonte ${font.label}${activeHeading ? ' (em uso nos títulos)' : ''}${activeBody ? ' (em uso nos textos)' : ''}`}
      className={cn(
        'group relative flex flex-col items-start gap-1.5 rounded-xl border bg-white p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
        active
          ? 'border-emerald-400 ring-2 ring-emerald-500/30'
          : 'border-stone-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm',
      )}
    >
      {(activeHeading || activeBody) && (
        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check className="size-3" aria-hidden />
        </span>
      )}
      <span
        className="block text-3xl leading-none text-stone-900"
        style={fontPreviewStyle(font)}
        aria-hidden
      >
        Aa
      </span>
      <span
        className="block w-full truncate text-xs font-medium text-stone-700"
        style={fontPreviewStyle(font)}
      >
        {font.label}
      </span>
      <span className="flex flex-wrap gap-1">
        {activeHeading && (
          <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[9px] font-semibold text-emerald-700 hover:bg-emerald-50">
            {FONT_SLOT_LABELS.heading}
          </Badge>
        )}
        {activeBody && (
          <Badge className="rounded-full border border-teal-200 bg-teal-50 px-1.5 py-0 text-[9px] font-semibold text-teal-700 hover:bg-teal-50">
            {FONT_SLOT_LABELS.body}
          </Badge>
        )}
      </span>
    </button>
  )
}

/** Seletor de tipografia da página do criador (nome/títulos + descrições) */
function FontPicker({
  heading,
  body,
  onHeadingChange,
  onBodyChange,
  mentorName,
}: {
  heading: string | null
  body: string | null
  onHeadingChange: (id: string | null) => void
  onBodyChange: (id: string | null) => void
  mentorName: string
}) {
  const [slot, setSlot] = useState<FontSlot>('heading')
  const [category, setCategory] = useState<MentorFontCategory | 'all'>('all')

  const visible = MENTOR_FONTS.filter((f) => category === 'all' || f.category === category)
  const activeId = slot === 'heading' ? heading : body

  const handleSelect = (id: string | null) => {
    if (slot === 'heading') onHeadingChange(id)
    else onBodyChange(id)
  }

  const headingFont = getMentorFont(heading)
  const bodyFont = getMentorFont(body)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
          <Type className="size-4 text-emerald-700" aria-hidden /> Tipografia da sua página
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Escolha a fonte do seu nome e títulos e a fonte das descrições — dá identidade à sua
          página pública. As fontes só são carregadas quando usadas (nada de página pesada).
        </p>
      </div>

      {/* Prévia ao vivo */}
      <div
        className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
        aria-label="Prévia da sua página com as fontes escolhidas"
      >
        <div className="h-14 w-full" style={avatarGradient(mentorName)} aria-hidden />
        <div className="px-4 pb-4 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Prévia</p>
          <p
            className="mt-1 text-xl font-extrabold tracking-tight text-stone-900"
            style={headingFontStyle(heading)}
          >
            {mentorName}
          </p>
          <p className="mt-0.5 text-xs font-medium text-stone-600" style={bodyFontStyle(body)}>
            Mentor verificado · Especialista na área
          </p>
          <p
            className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-500"
            style={bodyFontStyle(body)}
          >
            É assim que suas descrições serão exibidas para os alunos: contando sua metodologia,
            seu público e os resultados que você entrega em cada mentoria.
          </p>
          {(headingFont || bodyFont) && (
            <p className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-stone-400">
              {headingFont && <span>Títulos: {headingFont.label}</span>}
              {bodyFont && <span>· Textos: {bodyFont.label}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Slot em que a seleção é aplicada */}
      <div
        role="radiogroup"
        aria-label="Aplicar fonte em"
        className="flex w-full max-w-sm rounded-full border border-stone-200 bg-stone-50 p-1"
      >
        {(Object.keys(FONT_SLOT_LABELS) as FontSlot[]).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={slot === s}
            onClick={() => setSlot(s)}
            className={cn(
              'flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              slot === s ? 'bg-emerald-950 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900',
            )}
          >
            {FONT_SLOT_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Filtro por categoria */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar fontes por estilo">
        {MENTOR_FONT_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-pressed={category === c.value}
            onClick={() => setCategory(c.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              category === c.value
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-stone-200 bg-white text-stone-500 hover:border-emerald-200 hover:text-emerald-700',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grade de fontes */}
      <div
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4"
        role="listbox"
        aria-label={`Fontes para ${FONT_SLOT_LABELS[slot]}`}
      >
        {/* Opção padrão sempre visível */}
        <button
          type="button"
          onClick={() => handleSelect(null)}
          aria-pressed={activeId === null}
          aria-label="Selecionar fonte padrão da plataforma"
          className={cn(
            'relative flex flex-col items-start justify-center gap-1 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
            activeId === null
              ? 'border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-500/30'
              : 'border-stone-200 bg-stone-50 hover:border-emerald-300',
          )}
        >
          {activeId === null && (
            <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="size-3" aria-hidden />
            </span>
          )}
          <span className="text-2xl font-bold leading-none text-stone-400">Aa</span>
          <span className="text-xs font-medium text-stone-600">Padrão da plataforma</span>
        </button>
        {visible.map((f) => (
          <FontOptionCard
            key={f.id}
            font={f}
            activeHeading={heading === f.id}
            activeBody={body === f.id}
            onSelect={() => handleSelect(f.id)}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Selecionando para:{' '}
        <span className="font-semibold text-stone-700">{FONT_SLOT_LABELS[slot]}</span> — troque o
        destino acima para definir a outra fonte.
      </p>
    </div>
  )
}

// ---------- Formulário de perfil (criação e edição) ----------

export interface ProfileFormValues {
  headline: string
  description: string
  categories: string[]
  hourlyRate: number
  experienceYears: number
  languages: string
  socials: SocialLinksDTO
  /** Foto do mentor (User.avatarUrl) — null remove a foto atual */
  avatarUrl?: string | null
  /** Capa do perfil público — null remove a capa atual */
  coverUrl?: string | null
  /** Tipografia da página pública (ids de src/lib/fonts.ts; null = padrão) */
  fontHeading?: string | null
  fontBody?: string | null
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
  mentorName,
}: {
  initial?: ProfileFormValues
  submitLabel: string
  onSubmit: (values: ProfileFormValues) => Promise<void>
  /** Nome usado como fallback do avatar (iniciais) */
  mentorName: string
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial?.avatarUrl ?? null)
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.coverUrl ?? null)
  const [fontHeading, setFontHeading] = useState<string | null>(initial?.fontHeading ?? null)
  const [fontBody, setFontBody] = useState<string | null>(initial?.fontBody ?? null)
  const [uploadingPhoto, setUploadingPhoto] = useState<'avatar' | 'cover' | null>(null)
  // Só envia no payload a foto que o usuário realmente mexeu: undefined = manter atual, null = remover
  const [photoTouched, setPhotoTouched] = useState<{ avatar: boolean; cover: boolean }>({
    avatar: false,
    cover: false,
  })

  const toggleCategory = (category: string) => {
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
    setErrors((prev) => ({ ...prev, categories: undefined }))
  }

  const handlePhotoFile = async (kind: 'avatar' | 'cover', file: File | null | undefined) => {
    if (!file || uploadingPhoto) return
    setUploadingPhoto(kind)
    const url = await uploadImageFile(file)
    if (url) {
      if (kind === 'avatar') {
        setAvatarUrl(url)
        setPhotoTouched((prev) => ({ ...prev, avatar: true }))
      } else {
        setCoverUrl(url)
        setPhotoTouched((prev) => ({ ...prev, cover: true }))
      }
    }
    setUploadingPhoto(null)
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
        // undefined = não alterar no servidor; null = remover; string = definir
        avatarUrl: photoTouched.avatar ? avatarUrl : undefined,
        coverUrl: photoTouched.cover ? coverUrl : undefined,
        // Tipografia sempre enviada (null volta ao padrão da plataforma)
        fontHeading,
        fontBody,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-6" noValidate>
      {/* Fotos do perfil (capa + avatar) */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <Camera className="size-4 text-emerald-700" aria-hidden /> Fotos do perfil
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sua foto aparece no Explorar, nos cursos e na navbar. A capa aparece no topo do seu perfil
            público.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {coverUrl ? (
            <div className="h-44 w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100 sm:h-52">
              <img src={coverUrl} alt="Capa do seu perfil" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-44 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 bg-stone-50 sm:h-52">
              <ImagePlus className="size-6 text-stone-400" aria-hidden />
              <p className="text-xs text-stone-500">Capa 1440×720 recomendada — aparece em destaque no topo da sua página</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {uploadingPhoto !== null ? (
              <Button type="button" size="sm" variant="outline" disabled>
                {uploadingPhoto === 'cover' ? 'Enviando...' : 'Enviar capa'}
              </Button>
            ) : (
              <Button type="button" size="sm" variant="outline" asChild>
                <Label htmlFor="mentor-cover-upload" className="cursor-pointer">
                  Enviar capa
                </Label>
              </Button>
            )}
            {coverUrl ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={uploadingPhoto !== null}
                onClick={() => {
                  setCoverUrl(null)
                  setPhotoTouched((prev) => ({ ...prev, cover: true }))
                }}
              >
                Remover
              </Button>
            ) : null}
            <input
              id="mentor-cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              tabIndex={-1}
              onChange={(event) => {
                void handlePhotoFile('cover', event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={mentorName} src={avatarUrl} size="xl" />
          <div className="flex flex-wrap items-center gap-2">
            {uploadingPhoto !== null ? (
              <Button type="button" size="sm" variant="outline" disabled>
                {uploadingPhoto === 'avatar' ? 'Enviando...' : 'Enviar foto'}
              </Button>
            ) : (
              <Button type="button" size="sm" variant="outline" asChild>
                <Label htmlFor="mentor-avatar-upload" className="cursor-pointer">
                  Enviar foto
                </Label>
              </Button>
            )}
            {avatarUrl ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={uploadingPhoto !== null}
                onClick={() => {
                  setAvatarUrl(null)
                  setPhotoTouched((prev) => ({ ...prev, avatar: true }))
                }}
              >
                Remover
              </Button>
            ) : null}
            <input
              id="mentor-avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              tabIndex={-1}
              onChange={(event) => {
                void handlePhotoFile('avatar', event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>
        </div>
      </div>

      {/* Tipografia da página pública (nome/títulos + descrições) */}
      <Separator />
      <FontPicker
        heading={fontHeading}
        body={fontBody}
        onHeadingChange={setFontHeading}
        onBodyChange={setFontBody}
        mentorName={mentorName}
      />
      <Separator />

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

function CoursesManager({
  userId,
  onChanged,
  onCoursesChange,
}: {
  userId: string
  onChanged: () => Promise<void>
  /** Notifica o pai com a lista de cursos (usada pelo gerador de links) */
  onCoursesChange?: (courses: CourseListItemDTO[]) => void
}) {
  const [courses, setCourses] = useState<CourseListItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CourseListItemDTO | null>(null)
  const [toDelete, setToDelete] = useState<CourseListItemDTO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [lessonsCourse, setLessonsCourse] = useState<CourseListItemDTO | null>(null)
  const [lessonsOpen, setLessonsOpen] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [level, setLevel] = useState<string>('INICIANTE')
  const [price, setPrice] = useState('0')
  const [mentorshipCount, setMentorshipCount] = useState('0')
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<CourseFormErrors>({})

  const fetchCourses = useCallback(async (): Promise<CourseListItemDTO[]> => {
    const list = await api.listCourses({ mentorUserId: userId })
    setCourses(list)
    onCoursesChange?.(list)
    return list
  }, [userId, onCoursesChange])

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
    setMentorshipCount('0')
    setCoverUrl(null)
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
    setMentorshipCount(String(course.mentorshipCount ?? 0))
    setCoverUrl(course.coverUrl ?? null)
    setFormErrors({})
    setDialogOpen(true)
  }

  const handleCourseCoverFile = async (file: File | null | undefined) => {
    if (!file || uploadingCover) return
    setUploadingCover(true)
    const url = await uploadImageFile(file)
    if (url) setCoverUrl(url)
    setUploadingCover(false)
  }

  const copyCourseLink = (course: CourseListItemDTO) => {
    copyToClipboard(buildCourseUrl(course.id), 'Link de impulsionamento copiado!')
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
      const mentorships = Math.max(0, Math.min(20, Math.round(Number(mentorshipCount) || 0)))
      if (editing) {
        await api.updateCourse(editing.id, {
          userId,
          title: title.trim(),
          description: description.trim(),
          category,
          level,
          price: priceNum,
          coverUrl,
          mentorshipCount: mentorships,
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
          coverUrl,
          mentorshipCount: mentorships,
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
                {course.coverUrl ? (
                  <img
                    src={course.coverUrl}
                    alt=""
                    className="h-12 w-20 shrink-0 rounded-lg object-cover ring-1 ring-stone-200"
                  />
                ) : null}
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
                    {course.lessonCount} {course.lessonCount === 1 ? 'aula' : 'aulas'}
                    {course.liveCount > 0 ? ` · ${course.liveCount} ao vivo` : ''} ·{' '}
                    {course.price === 0 ? 'Gratuito' : currencyBRL(course.price)} · {course.studentCount}{' '}
                    {course.studentCount === 1 ? 'aluno' : 'alunos'}
                    {course.mentorshipCount > 0 ? ` · ${course.mentorshipCount} mentoria${course.mentorshipCount > 1 ? 's' : ''}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-stone-600"
                    aria-label={`Copiar link de impulsionamento de ${course.title}`}
                    onClick={() => copyCourseLink(course)}
                  >
                    <Link2 className="size-4" aria-hidden /> Link
                  </Button>
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="course-mentorships">Mentorias 1:1 inclusas</Label>
              <Input
                id="course-mentorships"
                type="number"
                min={0}
                max={20}
                step={1}
                value={mentorshipCount}
                onChange={(event) => setMentorshipCount(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Sessões de mentoria que o aluno pode agendar com você (0 = nenhuma).
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Capa do curso</Label>
              {coverUrl ? (
                <div className="h-24 w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                  <img src={coverUrl} alt="Capa do curso" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-stone-300 bg-stone-50">
                  <ImagePlus className="size-5 text-stone-400" aria-hidden />
                  <p className="text-xs text-stone-500">Capa 1280×720 recomendada</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {uploadingCover ? (
                  <Button type="button" size="sm" variant="outline" disabled>
                    Enviando...
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Label htmlFor="course-cover-upload" className="cursor-pointer">
                      Enviar capa
                    </Label>
                  </Button>
                )}
                {coverUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={uploadingCover}
                    onClick={() => setCoverUrl(null)}
                  >
                    Remover
                  </Button>
                ) : null}
                <input
                  id="course-cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  tabIndex={-1}
                  onChange={(event) => {
                    void handleCourseCoverFile(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </div>
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
  startsAt?: string
  meetingUrl?: string
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
  const [themes, setThemes] = useState<CourseThemeDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [durationMin, setDurationMin] = useState('15')
  const [videoUrl, setVideoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [kind, setKind] = useState<'RECORDED' | 'TEXT' | 'LIVE' | 'READING'>('RECORDED')
  const [startsAt, setStartsAt] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [attachments, setAttachments] = useState<LessonAttachmentDTO[]>([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<LessonFormErrors>({})
  // Temas (módulos) do curso — seletor na nova aula + mover aula de tema
  const [themeId, setThemeId] = useState('none')
  const [showNewTheme, setShowNewTheme] = useState(false)
  const [newThemeTitle, setNewThemeTitle] = useState('')
  const [creatingTheme, setCreatingTheme] = useState(false)
  const [movingId, setMovingId] = useState<string | null>(null)
  // Quiz da aula — gerenciador de perguntas (correção automática)
  const [quizLesson, setQuizLesson] = useState<CourseLessonDTO | null>(null)
  const [quizOpen, setQuizOpen] = useState(false)
  // Conteúdos da Biblioteca do mentor (para aulas READING)
  const [libraryItems, setLibraryItems] = useState<LibraryItemDTO[] | null>(null)
  const [libraryItemId, setLibraryItemId] = useState('')

  const fetchLessons = useCallback(async () => {
    const detail = await api.getCourse(course.id)
    setLessons(detail.lessons)
    setThemes([...(detail.themes ?? [])].sort((a, b) => a.order - b.order))
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
    setKind('RECORDED')
    setStartsAt('')
    setMeetingUrl('')
    setAttachments([])
    setFormErrors({})
    setThemeId('none')
    setShowNewTheme(false)
    setNewThemeTitle('')
    setLibraryItemId('')
    setLibraryItems(null)
    fetchLessons()
      .catch((err: unknown) => {
        if (active) {
          toast.error(err instanceof Error ? err.message : 'Não foi possível carregar as aulas.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    // Conteúdos da Biblioteca do próprio mentor (inclui rascunhos)
    api
      .listLibrary({ authorUserId: userId })
      .then((items) => {
        if (active) setLibraryItems(items)
      })
      .catch(() => {
        if (active) setLibraryItems([])
      })
    return () => {
      active = false
    }
  }, [open, fetchLessons, userId])

  const handleAdd = async () => {
    const errs: LessonFormErrors = {}
    if (title.trim().length < 3) {
      errs.title = 'Dê um título à aula (mínimo 3 caracteres).'
    }
    const duration = Number(durationMin)
    if (durationMin.trim() === '' || Number.isNaN(duration) || duration <= 0) {
      errs.durationMin = 'Informe a duração em minutos.'
    }
    if (kind === 'READING') {
      if (!libraryItemId) {
        errs.material = 'Selecione o artigo ou livro da Biblioteca.'
      }
    } else if (kind === 'LIVE') {
      if (!startsAt.trim()) {
        errs.startsAt = 'Informe data e hora da live.'
      }
      if (!meetingUrl.trim() && !videoUrl.trim()) {
        errs.meetingUrl = 'A live precisa do link da transmissão (ou da gravação).'
      }
    } else if (!videoUrl.trim() && !content.trim() && attachments.length === 0) {
      errs.material = 'A aula precisa de um vídeo, conteúdo textual ou anexos.'
    }
    setFormErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      await api.createLesson(course.id, {
        userId,
        title: title.trim(),
        description: description.trim() || undefined,
        kind,
        videoUrl: kind === 'READING' ? undefined : videoUrl.trim() || undefined,
        content: kind === 'READING' ? undefined : content.trim() || undefined,
        startsAt: kind === 'LIVE' ? startsAt.trim() : undefined,
        meetingUrl: meetingUrl.trim() || undefined,
        attachments: kind !== 'READING' && attachments.length > 0 ? attachments : undefined,
        themeId: themeId === 'none' ? null : themeId,
        libraryItemId: kind === 'READING' ? libraryItemId : undefined,
        durationMin: duration,
      })
      toast.success(kind === 'LIVE' ? 'Aula ao vivo agendada!' : 'Aula adicionada!')
      setTitle('')
      setDurationMin('15')
      setVideoUrl('')
      setDescription('')
      setContent('')
      setStartsAt('')
      setMeetingUrl('')
      setAttachments([])
      setLibraryItemId('')
      setAdding(false)
      await Promise.all([fetchLessons(), onChanged()])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível adicionar a aula.')
    } finally {
      setSaving(false)
    }
  }

  const handleAttachmentFile = async (file: File | null | undefined) => {
    if (!file || uploadingAttachment) return
    if (attachments.length >= 10) {
      toast.error('Máximo de 10 anexos por aula.')
      return
    }
    setUploadingAttachment(true)
    try {
      const uploaded = await api.uploadAttachment(file)
      setAttachments((prev) => [...prev, uploaded])
      toast.success('Anexo enviado!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar o anexo.')
    } finally {
      setUploadingAttachment(false)
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

  /** Abre/fecha o gerenciador de quiz; ao fechar, atualiza a contagem de perguntas na lista */
  const handleQuizOpenChange = (next: boolean) => {
    setQuizOpen(next)
    if (!next) {
      setQuizLesson(null)
      fetchLessons().catch(() => {})
    }
  }

  const handleCreateTheme = async () => {
    const trimmed = newThemeTitle.trim()
    if (trimmed.length < 2) {
      toast.error('Dê um título ao tema (mínimo 2 caracteres).')
      return
    }
    setCreatingTheme(true)
    try {
      const created = await api.createTheme(course.id, { userId, title: trimmed })
      toast.success('Tema criado!')
      setNewThemeTitle('')
      setShowNewTheme(false)
      // Atualiza a lista de temas com o order autoritativo do backend
      const detail = await api.getCourse(course.id)
      setThemes([...(detail.themes ?? [])].sort((a, b) => a.order - b.order))
      setThemeId(created.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar o tema.')
    } finally {
      setCreatingTheme(false)
    }
  }

  const handleMoveLesson = async (lesson: CourseLessonDTO, targetThemeId: string | null) => {
    setMovingId(lesson.id)
    try {
      await api.updateLesson(course.id, lesson.id, { userId, themeId: targetThemeId })
      toast.success('Aula movida!')
      await fetchLessons()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível mover a aula.')
    } finally {
      setMovingId(null)
    }
  }

  const handleLibraryItemChange = (value: string) => {
    setLibraryItemId(value)
    setFormErrors((prev) => ({ ...prev, material: undefined }))
    const item = (libraryItems ?? []).find((i) => i.id === value)
    if (item) {
      // Pré-preenche duração com o tempo de leitura e o título (se vazio)
      if (item.readingMin > 0) setDurationMin(String(item.readingMin))
      if (!title.trim()) setTitle(item.title)
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
                      {lesson.kind === 'LIVE' ? (
                        <>
                          <Radio className="size-3 text-rose-500" aria-hidden />
                          <span>
                            Ao vivo ·{' '}
                            {lesson.startsAt
                              ? `${formatDayLabel(lesson.startsAt)} ${formatTimeLabel(lesson.startsAt)}`
                              : 'agendada'}
                          </span>
                        </>
                      ) : lesson.kind === 'READING' ? (
                        <>
                          <BookOpen className="size-3 text-amber-600" aria-hidden />
                          <span>Artigo/Livro · {lesson.durationMin} min</span>
                        </>
                      ) : lesson.videoUrl ? (
                        <>
                          <Video className="size-3" aria-hidden />
                          <span>Vídeo · {lesson.durationMin} min</span>
                        </>
                      ) : (
                        <>
                          <FileText className="size-3" aria-hidden />
                          <span>Texto · {lesson.durationMin} min</span>
                        </>
                      )}
                      {lesson.hasAttachments ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Paperclip className="size-3" aria-hidden /> {lesson.attachments.length}
                        </span>
                      ) : null}
                    </p>
                    <span className="mt-1 inline-flex max-w-full items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
                      <span className="truncate">
                        {themes.find((t) => t.id === lesson.themeId)?.title ?? 'Sem tema'}
                      </span>
                    </span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                        aria-label={`Mover para tema: ${lesson.title}`}
                      >
                        <FolderInput className="size-3.5" aria-hidden />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56 p-1.5">
                      <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">
                        Mover para tema
                      </p>
                      <div className="max-h-48 overflow-y-auto">
                        <button
                          type="button"
                          disabled={movingId === lesson.id}
                          onClick={() => void handleMoveLesson(lesson, null)}
                          className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-50"
                        >
                          Sem tema
                          {lesson.themeId === null ? (
                            <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
                          ) : null}
                        </button>
                        {themes.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            disabled={movingId === lesson.id}
                            onClick={() => void handleMoveLesson(lesson, t.id)}
                            className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-50"
                          >
                            <span className="truncate">{t.title}</span>
                            {lesson.themeId === t.id ? (
                              <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-8 shrink-0 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                    aria-label={`Gerenciar quiz de ${lesson.title}`}
                    onClick={() => {
                      setQuizLesson(lesson)
                      setQuizOpen(true)
                    }}
                  >
                    <ListChecks className="size-3.5" aria-hidden />
                    {lesson.quizCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold leading-none text-white">
                        {lesson.quizCount}
                      </span>
                    ) : null}
                  </Button>
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

              {/* Tema (módulo) da aula + criação rápida de tema */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="lesson-theme">Tema</Label>
                <div className="flex items-center gap-2">
                  <Select value={themeId} onValueChange={setThemeId}>
                    <SelectTrigger id="lesson-theme" className="w-full">
                      <SelectValue placeholder="Tema da aula" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem tema</SelectItem>
                      {themes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 shrink-0"
                    onClick={() => setShowNewTheme((v) => !v)}
                    aria-expanded={showNewTheme}
                  >
                    <Plus className="size-4" aria-hidden /> Novo tema
                  </Button>
                </div>
                {showNewTheme ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newThemeTitle}
                      onChange={(event) => setNewThemeTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void handleCreateTheme()
                        }
                      }}
                      placeholder="Ex.: Módulo 1 — Fundamentos"
                      aria-label="Título do novo tema"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 shrink-0"
                      disabled={creatingTheme || newThemeTitle.trim().length < 2}
                      onClick={() => void handleCreateTheme()}
                    >
                      {creatingTheme ? 'Criando...' : 'Criar'}
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Tipo de aula */}
              <div className="flex flex-col gap-2">
                <Label>Tipo de aula</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      { value: 'RECORDED', label: 'Vídeo', icon: Video },
                      { value: 'TEXT', label: 'Leitura', icon: FileText },
                      { value: 'LIVE', label: 'Ao vivo', icon: Radio },
                      { value: 'READING', label: 'Artigo/Livro', icon: BookOpen },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setKind(opt.value)}
                      aria-pressed={kind === opt.value}
                      className={cn(
                        'flex min-h-11 items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold transition-colors',
                        kind === opt.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                      )}
                    >
                      <opt.icon className="size-4" aria-hidden /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {kind === 'LIVE' ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="lesson-starts">Data e hora da live</Label>
                      <Input
                        id="lesson-starts"
                        type="datetime-local"
                        value={startsAt}
                        onChange={(event) => setStartsAt(event.target.value)}
                        aria-invalid={Boolean(formErrors.startsAt)}
                      />
                      {formErrors.startsAt ? (
                        <p className="text-xs text-rose-600">{formErrors.startsAt}</p>
                      ) : null}
                    </div>
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
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lesson-meeting">Link da transmissão</Label>
                    <Input
                      id="lesson-meeting"
                      value={meetingUrl}
                      onChange={(event) => setMeetingUrl(event.target.value)}
                      placeholder="https://meet.google.com/... ou https://youtube.com/live/..."
                      autoComplete="off"
                      aria-invalid={Boolean(formErrors.meetingUrl)}
                    />
                    {formErrors.meetingUrl ? (
                      <p className="text-xs text-rose-600">{formErrors.meetingUrl}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Meet, Zoom, YouTube — aberto pelos alunos no horário da live.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lesson-video">Gravação (URL opcional)</Label>
                    <Input
                      id="lesson-video"
                      value={videoUrl}
                      onChange={(event) => setVideoUrl(event.target.value)}
                      placeholder="Cole depois da live, para quem perdeu"
                      autoComplete="off"
                    />
                  </div>
                </>
              ) : null}

              {/* Aula de leitura: artigo/livro da Biblioteca */}
              {kind === 'READING' ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lesson-library-item">Conteúdo da Biblioteca</Label>
                    {libraryItems === null ? (
                      <Skeleton className="h-10 w-full rounded-lg" />
                    ) : libraryItems.length === 0 ? (
                      <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
                        <Library className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        Você ainda não publicou artigos ou livros. Crie na seção Minha Biblioteca.
                      </p>
                    ) : (
                      <Select value={libraryItemId} onValueChange={handleLibraryItemChange}>
                        <SelectTrigger
                          id="lesson-library-item"
                          className="w-full"
                          aria-invalid={Boolean(formErrors.material)}
                        >
                          <SelectValue placeholder="Selecione um artigo ou livro..." />
                        </SelectTrigger>
                        <SelectContent>
                          {libraryItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.kind === 'BOOK' ? 'Livro' : 'Artigo'} · {item.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {formErrors.material ? (
                      <p className="text-xs text-rose-600">{formErrors.material}</p>
                    ) : null}
                  </div>
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
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Pré-preenchida com o tempo de leitura do item escolhido.
                      </p>
                    )}
                  </div>
                </>
              ) : null}

              {kind === 'RECORDED' || kind === 'TEXT' ? (
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
                    <Label htmlFor="lesson-video">Vídeo (URL{kind === 'TEXT' ? ' opcional' : ''})</Label>
                    <Input
                      id="lesson-video"
                      value={videoUrl}
                      onChange={(event) => setVideoUrl(event.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      autoComplete="off"
                    />
                  </div>
                </div>
              ) : null}

              {kind === 'RECORDED' || kind === 'TEXT' ? (
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
              ) : null}

              {/* Anexos para download */}
              {kind !== 'READING' ? (
                <div className="flex flex-col gap-2">
                  <Label>Anexos para download (opcional)</Label>
                  {attachments.length > 0 ? (
                    <ul className="space-y-1.5">
                      {attachments.map((att, i) => (
                        <li
                          key={`${att.url}-${i}`}
                          className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5"
                        >
                          <Paperclip className="size-3.5 shrink-0 text-stone-400" aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-stone-700">
                            {att.name}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remover anexo ${att.name}`}
                            className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="flex items-center gap-2">
                    {uploadingAttachment ? (
                      <Button type="button" size="sm" variant="outline" disabled>
                        Enviando...
                      </Button>
                    ) : (
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Label htmlFor="lesson-attachment-upload" className="cursor-pointer">
                          <Paperclip className="size-3.5" aria-hidden /> Adicionar anexo
                        </Label>
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">PDF, ZIP, DOC(X), PPT(X), até 20MB</span>
                    <input
                      id="lesson-attachment-upload"
                      type="file"
                      className="hidden"
                      tabIndex={-1}
                      onChange={(event) => {
                        void handleAttachmentFile(event.target.files?.[0])
                        event.target.value = ''
                      }}
                    />
                  </div>
                </div>
              ) : null}

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
                  {saving ? 'Adicionando...' : kind === 'LIVE' ? 'Agendar aula ao vivo' : 'Adicionar aula'}
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

      {/* Dialog: quiz da aula (perguntas com correção automática) */}
      {quizLesson && (
        <QuizManagerDialog
          course={course}
          lesson={quizLesson}
          user={{ id: userId }}
          open={quizOpen}
          onOpenChange={handleQuizOpenChange}
        />
      )}
    </Dialog>
  )
}

// ---------- Dialog de quiz da aula (mentor) ----------

const QUIZ_OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const

interface QuizFormErrors {
  prompt?: string
  options?: string
  correctIndex?: string
}

/** Gerencia as perguntas de quiz de uma aula: listar, criar, editar e excluir. */
function QuizManagerDialog({
  course,
  lesson,
  user,
  open,
  onOpenChange,
}: {
  course: CourseListItemDTO
  lesson: CourseLessonDTO
  /** Basta o id do mentor para as chamadas de API do quiz */
  user: { id: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [quizzes, setQuizzes] = useState<QuizDTO[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toDelete, setToDelete] = useState<QuizDTO | null>(null)
  // Formulário compartilhado entre criar (formOpen) e editar (editingId)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [explanation, setExplanation] = useState('')
  const [formErrors, setFormErrors] = useState<QuizFormErrors>({})

  const fetchQuizzes = useCallback(async () => {
    const list = await api.listLessonQuizzes(lesson.id, user.id)
    setQuizzes(list)
  }, [lesson.id, user.id])

  const resetForm = useCallback(() => {
    setPrompt('')
    setOptions(['', ''])
    setCorrectIndex(null)
    setExplanation('')
    setFormErrors({})
  }, [])

  // Carrega as perguntas sempre que o diálogo abre
  useEffect(() => {
    if (!open) return
    let active = true
    setQuizzes(null)
    setFormOpen(false)
    setEditingId(null)
    resetForm()
    api
      .listLessonQuizzes(lesson.id, user.id)
      .then((list) => {
        if (active) setQuizzes(list)
      })
      .catch((err: unknown) => {
        if (active) {
          toast.error(err instanceof Error ? err.message : 'Não foi possível carregar o quiz.')
          setQuizzes([])
        }
      })
    return () => {
      active = false
    }
  }, [open, lesson.id, user.id, resetForm])

  const openCreate = () => {
    setEditingId(null)
    resetForm()
    setFormOpen(true)
  }

  const openEdit = (quiz: QuizDTO) => {
    setEditingId(quiz.id)
    setPrompt(quiz.prompt)
    setOptions(quiz.options.length >= 2 ? [...quiz.options] : [...quiz.options, ''])
    setCorrectIndex(quiz.correctIndex)
    setExplanation(quiz.explanation ?? '')
    setFormErrors({})
    setFormOpen(true)
  }

  const cancelForm = () => {
    setFormOpen(false)
    setEditingId(null)
    resetForm()
  }

  const addOption = () => {
    setOptions((prev) => (prev.length >= 6 ? prev : [...prev, '']))
  }

  /** Remove uma alternativa e reajusta o índice da correta (mínimo de 2 alternativas) */
  const removeOption = (index: number) => {
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)))
    setCorrectIndex((prev) => {
      if (prev === null) return null
      if (prev === index) return null // a correta foi removida — é preciso marcar outra
      if (prev > index) return prev - 1
      return prev
    })
  }

  const handleSave = async () => {
    // Validação client — mensagens do servidor têm prioridade (chegam via toast)
    const errs: QuizFormErrors = {}
    if (prompt.trim().length < 5) {
      errs.prompt = 'Escreva a pergunta (mínimo 5 caracteres).'
    }
    if (options.length < 2 || options.length > 6 || options.some((o) => o.trim() === '')) {
      errs.options = 'Informe de 2 a 6 alternativas, todas preenchidas.'
    }
    if (correctIndex === null || correctIndex < 0 || correctIndex >= options.length) {
      errs.correctIndex = 'Marque qual alternativa é a correta.'
    }
    setFormErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      const payload = {
        userId: user.id,
        prompt: prompt.trim(),
        options: options.map((o) => o.trim()),
        correctIndex: correctIndex as number,
        explanation: explanation.trim(),
      }
      if (editingId) {
        await api.updateQuiz(editingId, payload)
        toast.success('Pergunta atualizada!')
        setEditingId(null)
        setFormOpen(false)
      } else {
        await api.createQuiz(lesson.id, payload)
        toast.success('Pergunta adicionada ao quiz')
        setFormOpen(false)
      }
      resetForm()
      await fetchQuizzes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar a pergunta.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.deleteQuiz(toDelete.id, user.id)
      toast.success('Pergunta removida do quiz.')
      setToDelete(null)
      await fetchQuizzes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover a pergunta.')
    } finally {
      setDeleting(false)
    }
  }

  const formVisible = formOpen || editingId !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-4 sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>Quiz da aula</DialogTitle>
          <DialogDescription>
            {course.title} · {lesson.title}
            {quizzes === null
              ? ''
              : ` · ${quizzes.length} ${quizzes.length === 1 ? 'pergunta' : 'perguntas'} · correção automática (+5 XP por acerto)`}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar]:w-1.5">
          {quizzes === null ? (
            <div className="space-y-3" aria-hidden>
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          ) : (
            <>
              {quizzes.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma pergunta ainda — crie a primeira para ajudar a fixar o aprendizado.
                </p>
              ) : (
                quizzes.map((quiz, index) => (
                  <div key={quiz.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                          Pergunta {index + 1}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold break-words text-stone-900">
                          {quiz.prompt}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                          aria-label={`Editar pergunta ${index + 1}`}
                          onClick={() => openEdit(quiz)}
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Excluir pergunta ${index + 1}`}
                          disabled={deleting}
                          onClick={() => setToDelete(quiz)}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {quiz.options.map((option, i) => {
                        const correct = i === quiz.correctIndex
                        return (
                          <li
                            key={`${quiz.id}-option-${i}`}
                            className={cn(
                              'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                              correct
                                ? 'border-emerald-300 bg-emerald-50 font-medium text-emerald-900'
                                : 'border-stone-200 bg-stone-50 text-stone-700'
                            )}
                          >
                            <span
                              className={cn(
                                'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                                correct ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'
                              )}
                            >
                              {QUIZ_OPTION_LETTERS[i] ?? i + 1}
                            </span>
                            <span className="min-w-0 flex-1 break-words">{option}</span>
                            {correct ? (
                              <Check
                                className="size-4 shrink-0 text-emerald-600"
                                aria-label="Alternativa correta"
                              />
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                    {quiz.explanation ? (
                      <p className="mt-3 rounded-xl bg-stone-50 p-3 text-xs leading-relaxed text-stone-600">
                        <span className="font-semibold text-stone-700">Explicação: </span>
                        {quiz.explanation}
                      </p>
                    ) : null}
                  </div>
                ))
              )}

              {formVisible ? (
                <form
                  className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleSave()
                  }}
                >
                  <p className="text-sm font-bold text-stone-900">
                    {editingId ? 'Editar pergunta' : 'Nova pergunta'}
                  </p>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="quiz-prompt">Pergunta</Label>
                    <Textarea
                      id="quiz-prompt"
                      rows={2}
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="Ex.: O que define o escopo de um MVP?"
                      aria-invalid={Boolean(formErrors.prompt)}
                    />
                    {formErrors.prompt ? (
                      <p className="text-xs text-rose-600">{formErrors.prompt}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Alternativas — marque a correta</Label>
                    <RadioGroup
                      value={correctIndex === null ? '' : String(correctIndex)}
                      onValueChange={(value) => setCorrectIndex(Number(value))}
                      className="flex flex-col gap-2"
                      aria-label="Marque a alternativa correta"
                    >
                      {options.map((option, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <RadioGroupItem
                            value={String(i)}
                            aria-label={`Marcar alternativa ${QUIZ_OPTION_LETTERS[i]} como correta`}
                            className="shrink-0 border-stone-300 text-emerald-600"
                          />
                          <Input
                            value={option}
                            onChange={(event) =>
                              setOptions((prev) =>
                                prev.map((o, j) => (j === i ? event.target.value : o))
                              )
                            }
                            placeholder={`Alternativa ${QUIZ_OPTION_LETTERS[i]}`}
                            aria-label={`Alternativa ${QUIZ_OPTION_LETTERS[i]}`}
                            className="min-w-0 flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Remover alternativa ${QUIZ_OPTION_LETTERS[i]}`}
                            disabled={options.length <= 2}
                            onClick={() => removeOption(i)}
                          >
                            <X className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      ))}
                    </RadioGroup>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={addOption}
                      disabled={options.length >= 6}
                    >
                      <Plus className="size-4" aria-hidden /> Adicionar alternativa ({options.length}/6)
                    </Button>
                    {formErrors.options ? (
                      <p className="text-xs text-rose-600">{formErrors.options}</p>
                    ) : null}
                    {formErrors.correctIndex ? (
                      <p className="text-xs text-rose-600">{formErrors.correctIndex}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="quiz-explanation">Explicação (opcional)</Label>
                    <Input
                      id="quiz-explanation"
                      value={explanation}
                      onChange={(event) => setExplanation(event.target.value)}
                      placeholder="Exibida ao aluno após responder"
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Aparece junto do resultado — certo ou errado — para reforçar o aprendizado.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={cancelForm} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={saving}
                      className="bg-emerald-700 hover:bg-emerald-800"
                    >
                      {saving ? 'Salvando...' : 'Salvar pergunta'}
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={openCreate}
                >
                  <Plus className="size-4" aria-hidden /> Adicionar pergunta
                </Button>
              )}
            </>
          )}
        </div>

        {/* AlertDialog: excluir pergunta do quiz */}
        <AlertDialog
          open={toDelete !== null}
          onOpenChange={(next) => {
            if (!next) setToDelete(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir pergunta?</AlertDialogTitle>
              <AlertDialogDescription>
                &quot;{toDelete?.prompt}&quot; sai do quiz desta aula. O histórico de quem já respondeu é
                mantido. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
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
      </DialogContent>
    </Dialog>
  )
}

// ---------- Link público + rastreamento (tráfego pago) ----------

const CHANNEL_LABELS: Record<string, string> = {
  paid_social: 'Tráfego pago social',
  paid_search: 'Google Ads',
  social: 'Social orgânico',
  email: 'E-mail',
  referral: 'Referência',
  direct: 'Direto',
}

function formatPercent(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`
}

function TrafficLinksSection({
  profile,
  courses,
  onSaved,
}: {
  profile: MentorDetailDTO
  courses: CourseListItemDTO[]
  onSaved: () => Promise<void>
}) {
  const [gaId, setGaId] = useState(profile.tracking?.gaMeasurementId ?? '')
  const [pixelId, setPixelId] = useState(profile.tracking?.metaPixelId ?? '')
  const [idErrors, setIdErrors] = useState<{ ga?: string; pixel?: string }>({})
  const [savingIds, setSavingIds] = useState(false)

  const [genSource, setGenSource] = useState('')
  const [genMedium, setGenMedium] = useState('')
  const [genCampaign, setGenCampaign] = useState('')
  const [genTarget, setGenTarget] = useState('lp')

  const slug = profile.slug ?? null

  // Se o curso selecionado deixar de existir, volta para a LP
  useEffect(() => {
    if (genTarget !== 'lp' && !courses.some((c) => c.id === genTarget)) {
      setGenTarget('lp')
    }
  }, [courses, genTarget])

  const lpUrl = slug ? buildMentorLpUrl(slug) : ''
  const utm = {
    source: genSource.trim() || undefined,
    medium: genMedium.trim() || undefined,
    campaign: genCampaign.trim() || undefined,
  }
  const genUrl =
    genTarget === 'lp' ? (slug ? buildMentorLpUrl(slug, utm) : '') : buildCourseUrl(genTarget, utm)

  const handleSaveIds = async () => {
    const errs: typeof idErrors = {}
    const gaTrim = gaId.trim()
    const pixelTrim = pixelId.trim()
    if (gaTrim && !/^G-[A-Z0-9-]+$/i.test(gaTrim)) {
      errs.ga = 'O ID do GA4 deve começar com "G-" (ex.: G-XXXXXXXXXX).'
    }
    if (pixelTrim && !/^\d+$/.test(pixelTrim)) {
      errs.pixel = 'O ID do Meta Pixel deve conter apenas números.'
    }
    setIdErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSavingIds(true)
    try {
      await api.saveMentorProfile({
        userId: profile.userId,
        headline: profile.headline,
        description: profile.description,
        categories: profile.categories,
        hourlyRate: profile.hourlyRate,
        experienceYears: profile.experienceYears,
        languages: profile.languages,
        socials: profile.socials,
        gaMeasurementId: gaTrim || null,
        metaPixelId: pixelTrim || null,
      })
      toast.success('IDs de rastreamento salvos! Suas campanhas já recebem as conversões.')
      await onSaved()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Não foi possível salvar os IDs de rastreamento.'
      )
    } finally {
      setSavingIds(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <TrendingUp className="size-4" aria-hidden />
          </span>
          Link público e tráfego pago
        </CardTitle>
        <CardDescription>
          Divulgue sua página de vendas, conecte seus pixels e crie links rastreados por campanha.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* 1. Sua página de vendas */}
        <section className="flex flex-col gap-2" aria-labelledby="lp-sales-url-title">
          <div>
            <p id="lp-sales-url-title" className="text-sm font-semibold text-stone-900">
              Sua página de vendas
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              Use este link em anúncios e bio — todos os acessos ficam rastreados com UTM.
            </p>
          </div>
          {lpUrl ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                readOnly
                value={lpUrl}
                className="font-mono text-xs sm:flex-1"
                aria-label="URL pública da sua página de vendas"
                onFocus={(event) => event.currentTarget.select()}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => copyToClipboard(lpUrl)}>
                  <Copy className="size-4" aria-hidden /> Copiar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(lpUrl, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="size-4" aria-hidden /> Abrir
                </Button>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-stone-300 px-3 py-2.5 text-xs text-stone-500">
              Salve seu perfil para gerar o seu link público.
            </p>
          )}
        </section>

        <Separator />

        {/* 2. Google Analytics 4 & Meta Pixel */}
        <section className="flex flex-col gap-3" aria-labelledby="tracking-ids-title">
          <div>
            <p id="tracking-ids-title" className="text-sm font-semibold text-stone-900">
              Google Analytics 4 &amp; Meta Pixel
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              Cole seus IDs para que suas campanhas recebam as conversões (PageView, ViewContent,
              InitiateCheckout, Purchase) disparadas pela plataforma.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tracking-ga-id">Google Analytics 4 (Measurement ID)</Label>
              <Input
                id="tracking-ga-id"
                value={gaId}
                onChange={(event) => {
                  setGaId(event.target.value)
                  setIdErrors((prev) => ({ ...prev, ga: undefined }))
                }}
                placeholder="G-XXXXXXXXXX"
                autoComplete="off"
                className="font-mono"
                aria-invalid={Boolean(idErrors.ga)}
              />
              {idErrors.ga ? <p className="text-xs text-rose-600">{idErrors.ga}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tracking-pixel-id">Meta Pixel ID</Label>
              <Input
                id="tracking-pixel-id"
                value={pixelId}
                onChange={(event) => {
                  setPixelId(event.target.value)
                  setIdErrors((prev) => ({ ...prev, pixel: undefined }))
                }}
                placeholder="1234567890123456"
                autoComplete="off"
                className="font-mono"
                inputMode="numeric"
                aria-invalid={Boolean(idErrors.pixel)}
              />
              {idErrors.pixel ? <p className="text-xs text-rose-600">{idErrors.pixel}</p> : null}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => void handleSaveIds()}
              disabled={savingIds}
              className="min-w-44"
            >
              <Save className="size-4" aria-hidden />{' '}
              {savingIds ? 'Salvando...' : 'Salvar IDs de rastreamento'}
            </Button>
          </div>
        </section>

        <Separator />

        {/* 3. Gerador de link de impulsionamento */}
        <section className="flex flex-col gap-3" aria-labelledby="boost-link-title">
          <div>
            <p
              id="boost-link-title"
              className="flex items-center gap-1.5 text-sm font-semibold text-stone-900"
            >
              <Megaphone className="size-4 text-emerald-700" aria-hidden /> Gerador de link de
              impulsionamento
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              Monte um link com UTM para cada campanha e acompanhe o retorno no painel de desempenho.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="utm-source" className="text-xs text-stone-500">
                utm_source
              </Label>
              <Input
                id="utm-source"
                value={genSource}
                onChange={(event) => setGenSource(event.target.value)}
                placeholder="instagram"
                autoComplete="off"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="utm-medium" className="text-xs text-stone-500">
                utm_medium
              </Label>
              <Input
                id="utm-medium"
                value={genMedium}
                onChange={(event) => setGenMedium(event.target.value)}
                placeholder="cpc ou bio"
                autoComplete="off"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="utm-campaign" className="text-xs text-stone-500">
                utm_campaign
              </Label>
              <Input
                id="utm-campaign"
                value={genCampaign}
                onChange={(event) => setGenCampaign(event.target.value)}
                placeholder="boost-jan-2025"
                autoComplete="off"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="boost-target" className="text-xs text-stone-500">
              Destino do link
            </Label>
            <Select value={genTarget} onValueChange={setGenTarget}>
              <SelectTrigger id="boost-target" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lp">Página completa (LP)</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              readOnly
              value={genUrl}
              className="font-mono text-xs sm:flex-1"
              aria-label="Link de impulsionamento gerado"
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!genUrl}
              onClick={() => copyToClipboard(genUrl)}
            >
              <Copy className="size-4" aria-hidden /> Copiar
            </Button>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}

// ---------- Painel de desempenho de tráfego ----------

function TrafficKpiTile({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3.5">
      <div
        className={cn(
          'flex size-8 items-center justify-center rounded-lg',
          accent
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
            : 'bg-stone-100 text-stone-600'
        )}
      >
        <Icon className="size-4" aria-hidden />
      </div>
      <p className="mt-2 truncate text-lg font-bold tracking-tight text-stone-900">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  )
}

function TrafficListBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</p>
      <div className="max-h-64 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar]:w-1.5">
        {children}
      </div>
    </div>
  )
}

function TrafficPanel({ userId }: { userId: string }) {
  const [stats, setStats] = useState<TrackingStatsDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      setStats(await api.trackingStats(userId))
    } catch {
      setFailed(true) // falha silenciosa: o painel oferece retry manual
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const totals = stats?.totals ?? null
  const hasTraffic = totals
    ? totals.pageviews > 0 || totals.checkouts > 0 || totals.purchases > 0
    : false
  const hasBreakdown = stats
    ? stats.byChannel.length > 0 || stats.bySource.length > 0 || stats.byCourse.length > 0
    : false
  const maxDailyPageviews = stats ? Math.max(1, ...stats.daily.map((d) => d.pageviews)) : 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <BarChart3 className="size-4" aria-hidden />
          </span>
          Desempenho de tráfego
        </CardTitle>
        <CardDescription>
          Visitas, vendas e receita atribuídas aos seus links rastreados nos últimos 14 dias.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : failed || !totals || !stats ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-stone-300 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar as estatísticas agora.
            </p>
            <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
              <RefreshCw className="size-4" aria-hidden /> Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TrafficKpiTile
                icon={Eye}
                label="Visitantes"
                value={totals.pageviews.toLocaleString('pt-BR')}
              />
              <TrafficKpiTile
                icon={ShoppingCart}
                label="Checkouts iniciados"
                value={totals.checkouts.toLocaleString('pt-BR')}
              />
              <TrafficKpiTile
                icon={BadgeCheck}
                label="Vendas"
                value={totals.purchases.toLocaleString('pt-BR')}
                accent
              />
              <TrafficKpiTile icon={Banknote} label="Receita" value={currencyBRL(totals.revenue)} accent />
            </div>
            <p className="text-xs text-stone-500">
              Taxa de conversão:{' '}
              <span className="font-semibold text-stone-900">{formatPercent(totals.conversionRate)}</span>
            </p>

            {!hasTraffic && !hasBreakdown ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-stone-300 py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 ring-1 ring-stone-200">
                  <BarChart3 className="size-6" aria-hidden />
                </div>
                <h3 className="mt-1 text-base font-semibold">Sem dados de tráfego ainda</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Divulgue seu link público (com UTM) — as visitas, vendas e a receita aparecem aqui
                  automaticamente.
                </p>
              </div>
            ) : (
              <>
                {totals.pageviews > 0 && stats.daily.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div
                      className="flex h-20 items-end gap-1"
                      role="img"
                      aria-label="Série diária de visitas e vendas nos últimos 14 dias"
                    >
                      {stats.daily.map((day) => (
                        <div
                          key={day.date}
                          title={`${day.pageviews} ${day.pageviews === 1 ? 'visita' : 'visitas'} · ${day.purchases} ${day.purchases === 1 ? 'venda' : 'vendas'}`}
                          className={cn(
                            'flex-1 rounded-t-sm',
                            day.purchases > 0 ? 'bg-emerald-600' : 'bg-emerald-200'
                          )}
                          style={{
                            height: `${Math.max(6, Math.round((day.pageviews / maxDailyPageviews) * 100))}%`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-sm bg-emerald-200" aria-hidden /> Visitas
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-sm bg-emerald-600" aria-hidden /> Dia com venda
                      </span>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <TrafficListBox title="Por canal">
                    {stats.byChannel.length === 0 ? (
                      <p className="py-2 text-xs text-stone-400">Sem dados ainda.</p>
                    ) : (
                      <div className="divide-y divide-stone-100">
                        {stats.byChannel.map((channel) => (
                          <div key={channel.channel} className="flex items-start justify-between gap-3 py-2.5">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-stone-900">
                                {CHANNEL_LABELS[channel.channel] ?? channel.channel}
                              </p>
                              <p className="text-xs text-stone-500">
                                {channel.pageviews.toLocaleString('pt-BR')}{' '}
                                {channel.pageviews === 1 ? 'visita' : 'visitas'}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-emerald-700">
                                {channel.purchases} {channel.purchases === 1 ? 'venda' : 'vendas'}
                              </p>
                              <p className="text-xs text-stone-500">{currencyBRL(channel.revenue)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TrafficListBox>

                  <TrafficListBox title="Principais origens">
                    {stats.bySource.length === 0 ? (
                      <p className="py-2 text-xs text-stone-400">Sem dados ainda.</p>
                    ) : (
                      <div className="divide-y divide-stone-100">
                        {stats.bySource.map((source) => (
                          <div
                            key={source.source || 'direct'}
                            className="flex items-start justify-between gap-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-mono text-sm font-medium text-stone-900">
                                {source.source || 'direto'}
                              </p>
                              <p className="text-xs text-stone-500">
                                {source.pageviews.toLocaleString('pt-BR')}{' '}
                                {source.pageviews === 1 ? 'visita' : 'visitas'}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-emerald-700">
                                {source.purchases} {source.purchases === 1 ? 'venda' : 'vendas'}
                              </p>
                              <p className="text-xs text-stone-500">{currencyBRL(source.revenue)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TrafficListBox>

                  <TrafficListBox title="Cursos que mais vendem">
                    {stats.byCourse.length === 0 ? (
                      <p className="py-2 text-xs text-stone-400">Sem vendas de cursos ainda.</p>
                    ) : (
                      <div className="divide-y divide-stone-100">
                        {stats.byCourse.map((course) => (
                          <div key={course.courseId} className="flex items-start justify-between gap-3 py-2.5">
                            <p className="min-w-0 truncate text-sm font-medium text-stone-900">
                              {course.title}
                            </p>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-emerald-700">
                                {course.purchases} {course.purchases === 1 ? 'venda' : 'vendas'}
                              </p>
                              <p className="text-xs text-stone-500">{currencyBRL(course.revenue)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TrafficListBox>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
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

// ---------- Painel em abas (estúdio do criador) ----------

const PANEL_TABS = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'perfil', label: 'Perfil público', icon: UserRound },
  { id: 'agenda', label: 'Agenda', icon: CalendarClock },
  { id: 'mural', label: 'Mural', icon: Newspaper },
  { id: 'cursos', label: 'Cursos', icon: ListVideo },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library },
  { id: 'trilhas', label: 'Trilhas', icon: Route },
  { id: 'divulgacao', label: 'Divulgação', icon: Megaphone },
] as const

type PanelTabId = (typeof PANEL_TABS)[number]['id']

const PANEL_SHORTCUTS: ReadonlyArray<{
  id: PanelTabId
  label: string
  description: string
  icon: LucideIcon
}> = [
  {
    id: 'perfil',
    label: 'Editar perfil',
    description: 'Headline, descrição, preço, fotos e fontes.',
    icon: UserRound,
  },
  {
    id: 'agenda',
    label: 'Agenda semanal',
    description: 'Horários em que alunos podem agendar sessões.',
    icon: CalendarClock,
  },
  {
    id: 'mural',
    label: 'Publicar conteúdo',
    description: 'Artigos, vídeos e workshops no mural.',
    icon: Newspaper,
  },
  {
    id: 'cursos',
    label: 'Criar curso',
    description: 'Temas, aulas, anexos e quizzes.',
    icon: ListVideo,
  },
  {
    id: 'biblioteca',
    label: 'Biblioteca',
    description: 'Artigos e livros reutilizáveis nas aulas.',
    icon: Library,
  },
  {
    id: 'trilhas',
    label: 'Trilhas',
    description: 'Combine cursos e conteúdos em jornadas.',
    icon: Route,
  },
  {
    id: 'divulgacao',
    label: 'Link & tráfego',
    description: 'Link rastreável e desempenho de vendas.',
    icon: Megaphone,
  },
]

function OverviewKpi({
  icon: Icon,
  label,
  value,
  footer,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-1.5 text-stone-500">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-stone-900">{value}</p>
      {footer ? <div className="mt-1.5 text-xs leading-snug text-muted-foreground">{footer}</div> : null}
    </div>
  )
}

// ---------- View principal ----------

export default function OnboardingView() {
  const user = useAppStore((state) => state.user)
  const setUser = useAppStore((state) => state.setUser)
  const userId = user?.id ?? null

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<MentorDetailDTO | null>(null)
  const [mentorCourses, setMentorCourses] = useState<CourseListItemDTO[]>([])
  const [tab, setTab] = useState<PanelTabId>('overview')

  const handleCoursesChange = useCallback((list: CourseListItemDTO[]) => {
    setMentorCourses(list)
  }, [])

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

  // A Visão geral precisa dos números de cursos/alunos mesmo sem montar CoursesManager
  // (o Radix desmonta abas inativas — CoursesManager só sincroniza quando a aba Cursos abre)
  const reloadCourses = useCallback(async () => {
    if (!userId) return
    try {
      setMentorCourses(await api.listCourses({ mentorUserId: userId }))
    } catch {
      // silencioso: KPIs ficam com o último valor conhecido (ou zero no primeiro load)
    }
  }, [userId])

  useEffect(() => {
    void reloadCourses()
  }, [reloadCourses])

  const totalStudents = mentorCourses.reduce((acc, course) => acc + (course.studentCount ?? 0), 0)

  const handleCreateProfile = useCallback(
    async (values: ProfileFormValues) => {
      if (!user) return
      await api.saveMentorProfile({ userId: user.id, ...values })
      // Mantém a navbar em sincronia quando a foto foi alterada nesta submissão
      if (values.avatarUrl !== undefined) {
        setUser({ ...user, avatarUrl: values.avatarUrl ?? null })
      }
      toast.success('Perfil publicado! Você já aparece no marketplace.')
      await reload()
    },
    [user, reload, setUser]
  )

  const handleUpdateProfile = useCallback(
    async (values: ProfileFormValues) => {
      if (!user) return
      await api.saveMentorProfile({ userId: user.id, ...values })
      // Mantém a navbar em sincronia quando a foto foi alterada nesta submissão
      if (values.avatarUrl !== undefined) {
        setUser({ ...user, avatarUrl: values.avatarUrl ?? null })
      }
      toast.success('Alterações salvas com sucesso!')
      await reload()
    },
    [user, reload, setUser]
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
            <MentorProfileForm
              submitLabel="Publicar meu perfil"
              onSubmit={handleCreateProfile}
              mentorName={user.name}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---------- Com perfil: painel em abas (estúdio do criador) ----------

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Painel do mentor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seu estúdio de criação — perfil, conteúdos, cursos e resultados em um só lugar.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(value) => setTab(value as PanelTabId)}>
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
          {/* Navegação única: faixa horizontal rolável no mobile, coluna lateral sticky no desktop */}
          <TabsList
            aria-label="Seções do painel"
            className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1.5 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-200 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1 lg:sticky lg:top-0 lg:flex-col lg:items-stretch lg:justify-start lg:self-start lg:overflow-visible"
          >
            {PANEL_TABS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="min-h-11 flex-none justify-start gap-2 rounded-xl px-3 hover:bg-stone-100 data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:hover:bg-emerald-700"
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Radix desmonta o conteúdo inativo — managers remontam ao reabrir a aba */}
          <div className="min-w-0">
            <TabsContent value="overview" className="min-w-0 mt-4 sm:mt-6">
              <div className="flex min-w-0 flex-col gap-6">
                <section aria-labelledby="panel-overview-title">
                  <h2 id="panel-overview-title" className="text-xl font-bold tracking-tight">
                    Olá, {firstName(profile.name)}!
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Este é o seu estúdio — gerencie o que você cria e como os alunos te encontram.
                  </p>
                </section>

                <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
                  <OverviewKpi
                    icon={Star}
                    label="Nota"
                    value={profile.rating > 0 ? profile.rating.toFixed(1).replace('.', ',') : '—'}
                    footer={
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Stars rating={profile.rating} size={12} />
                        <span>
                          {profile.reviewCount} {profile.reviewCount === 1 ? 'avaliação' : 'avaliações'}
                        </span>
                      </span>
                    }
                  />
                  <OverviewKpi icon={Users} label="Alunos" value={totalStudents} footer="soma dos seus cursos" />
                  <OverviewKpi
                    icon={GraduationCap}
                    label="Cursos"
                    value={mentorCourses.length}
                    footer="incluindo rascunhos"
                  />
                  <OverviewKpi
                    icon={Newspaper}
                    label="Conteúdos"
                    value={profile.contents.length}
                    footer="publicados no mural"
                  />
                </div>

                <section aria-labelledby="panel-shortcuts-title" className="flex flex-col gap-3">
                  <h3 id="panel-shortcuts-title" className="text-sm font-semibold text-stone-700">
                    Atalhos rápidos
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {PANEL_SHORTCUTS.map(({ id, label, description, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        aria-label={`Ir para a aba ${label}`}
                        onClick={() => setTab(id)}
                        className="group flex min-h-11 w-full min-w-0 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left transition-colors hover:border-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-stone-900">{label}</span>
                          <span className="mt-0.5 block text-xs leading-snug text-stone-500">{description}</span>
                        </span>
                        <ChevronRight
                          className="size-4 shrink-0 text-stone-300 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-600"
                          aria-hidden
                        />
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="perfil" className="min-w-0 mt-4 sm:mt-6">
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
                      avatarUrl: profile.avatarUrl ?? null,
                      coverUrl: profile.coverUrl ?? null,
                      fontHeading: profile.fontHeading ?? null,
                      fontBody: profile.fontBody ?? null,
                    }}
                    mentorName={profile.name}
                    submitLabel="Salvar alterações"
                    onSubmit={handleUpdateProfile}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agenda" className="min-w-0 mt-4 sm:mt-6">
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
            </TabsContent>

            <TabsContent value="mural" className="min-w-0 mt-4 sm:mt-6">
              <ContentsManager contents={profile.contents} userId={user.id} onChanged={reload} />
            </TabsContent>

            <TabsContent value="cursos" className="min-w-0 mt-4 sm:mt-6">
              <CoursesManager userId={user.id} onChanged={reload} onCoursesChange={handleCoursesChange} />
            </TabsContent>

            <TabsContent value="biblioteca" className="min-w-0 mt-4 sm:mt-6">
              <LibraryManager userId={user.id} onChanged={reload} />
            </TabsContent>

            <TabsContent value="trilhas" className="min-w-0 mt-4 sm:mt-6">
              <TracksManager userId={user.id} onChanged={reload} />
            </TabsContent>

            <TabsContent value="divulgacao" className="min-w-0 mt-4 sm:mt-6">
              <div className="flex min-w-0 flex-col gap-6">
                {/* 2. Link público e tráfego pago */}
                <TrafficLinksSection profile={profile} courses={mentorCourses} onSaved={reload} />

                {/* 3. Desempenho de tráfego */}
                <TrafficPanel userId={user.id} />
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
