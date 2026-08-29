'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ImagePlus,
  Pencil,
  Plus,
  Route,
  Trash2,
  X,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { CATEGORIES, LEVEL_LABELS, currencyBRL } from '@/lib/helpers'
import type {
  CourseListItemDTO,
  TrackDetailItemDTO,
  TrackItemInput,
  TrackItemSummaryDTO,
  TrackListItemDTO,
} from '@/lib/types'

const TRACK_LEVELS = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'] as const

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

interface TrackFormErrors {
  title?: string
  description?: string
  category?: string
  price?: string
  items?: string
}

/** Item de trilha em edição (cursos resolvem o título pela lista do mentor) */
interface DraftItem {
  key: string
  type: 'COURSE' | 'MENTORSHIP'
  courseId?: string
  title: string
  description: string
  sessionCount: number
}

export function TracksManager({
  userId,
  onChanged,
  onTracksChange,
}: {
  userId: string
  onChanged: () => Promise<void>
  /** Notifica o pai com a lista de trilhas (usado pelo gerador de links) */
  onTracksChange?: (tracks: TrackListItemDTO[]) => void
}) {
  const [tracks, setTracks] = useState<TrackListItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TrackListItemDTO | null>(null)
  const [toDelete, setToDelete] = useState<TrackListItemDTO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [level, setLevel] = useState<string>('INICIANTE')
  const [price, setPrice] = useState('0')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [formErrors, setFormErrors] = useState<TrackFormErrors>({})

  // Itens da trilha em edição + cursos do mentor (para o select "Adicionar curso")
  const [draftItems, setDraftItems] = useState<DraftItem[]>([])
  const [mentorCourses, setMentorCourses] = useState<CourseListItemDTO[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [msTitle, setMsTitle] = useState('')
  const [msSessions, setMsSessions] = useState('1')
  const [msDescription, setMsDescription] = useState('')
  const [msError, setMsError] = useState('')

  const keyRef = useRef(0)
  const nextKey = () => {
    keyRef.current += 1
    return `draft-item-${keyRef.current}`
  }
  // Marca que o mentor já mexeu nos itens (evita sobrescrever com o patch do detalhe)
  const itemsDirtyRef = useRef(false)

  const fetchTracks = useCallback(async (): Promise<TrackListItemDTO[]> => {
    const list = await api.listTracks({ mentorUserId: userId })
    setTracks(list)
    onTracksChange?.(list)
    return list
  }, [userId, onTracksChange])

  useEffect(() => {
    let active = true
    fetchTracks()
      .catch((err: unknown) => {
        if (active) {
          toast.error(err instanceof Error ? err.message : 'Não foi possível carregar suas trilhas.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [fetchTracks])

  /** Recarrega as trilhas locais e os dados do perfil (contagens) no pai */
  const refreshAll = useCallback(async () => {
    await Promise.all([onChanged(), fetchTracks()])
  }, [onChanged, fetchTracks])

  // Cursos do mentor para o select de itens — carregados ao abrir o dialog
  useEffect(() => {
    if (!dialogOpen) return
    let active = true
    setLoadingCourses(true)
    api
      .listCourses({ mentorUserId: userId })
      .then((list) => {
        if (active) setMentorCourses(list)
      })
      .catch((err: unknown) => {
        if (active) {
          toast.error(err instanceof Error ? err.message : 'Não foi possível carregar seus cursos.')
        }
      })
      .finally(() => {
        if (active) setLoadingCourses(false)
      })
    return () => {
      active = false
    }
  }, [dialogOpen, userId])

  const resetMentorshipForm = () => {
    setMsTitle('')
    setMsSessions('1')
    setMsDescription('')
    setMsError('')
  }

  const openCreate = () => {
    setEditing(null)
    setTitle('')
    setDescription('')
    setCategory('')
    setLevel('INICIANTE')
    setPrice('0')
    setCoverUrl(null)
    setDraftItems([])
    setSelectedCourseId('')
    resetMentorshipForm()
    setFormErrors({})
    itemsDirtyRef.current = false
    setDialogOpen(true)
  }

  const draftFromDetail = (item: TrackDetailItemDTO): DraftItem => ({
    key: nextKey(),
    type: item.type === 'MENTORSHIP' ? 'MENTORSHIP' : 'COURSE',
    courseId: item.courseId ?? undefined,
    title: item.title,
    description: item.description ?? '',
    sessionCount: item.sessionCount,
  })

  const draftFromSummary = (item: TrackItemSummaryDTO): DraftItem => ({
    key: nextKey(),
    type: item.type === 'MENTORSHIP' ? 'MENTORSHIP' : 'COURSE',
    courseId: item.courseId ?? undefined,
    title: item.title,
    description: '',
    sessionCount: item.sessionCount,
  })

  const openEdit = (track: TrackListItemDTO) => {
    setEditing(track)
    setTitle(track.title)
    setDescription(track.description)
    setCategory(track.category)
    setLevel(track.level)
    setPrice(String(track.price))
    setCoverUrl(track.coverUrl ?? null)
    setDraftItems(track.items.map(draftFromSummary))
    setSelectedCourseId('')
    resetMentorshipForm()
    setFormErrors({})
    itemsDirtyRef.current = false
    setDialogOpen(true)

    // Enriquece com as descrições dos blocos de mentoria (o resumo não as traz)
    api
      .getTrack(track.id)
      .then((detail) => {
        if (itemsDirtyRef.current) return
        setDraftItems(detail.items.map(draftFromDetail))
      })
      .catch(() => {
        /* mantém os itens do resumo */
      })
  }

  const handleCoverFile = async (file: File | null | undefined) => {
    if (!file || uploadingCover) return
    setUploadingCover(true)
    const url = await uploadImageFile(file)
    if (url) setCoverUrl(url)
    setUploadingCover(false)
  }

  const markItemsChanged = () => {
    itemsDirtyRef.current = true
    setFormErrors((prev) => ({ ...prev, items: undefined }))
  }

  const addCourse = () => {
    if (!selectedCourseId) return
    const course = mentorCourses.find((c) => c.id === selectedCourseId)
    if (!course) return
    if (draftItems.some((d) => d.type === 'COURSE' && d.courseId === course.id)) {
      toast.info('Este curso já está na trilha.')
      return
    }
    setDraftItems((prev) => [
      ...prev,
      { key: nextKey(), type: 'COURSE', courseId: course.id, title: course.title, description: '', sessionCount: 0 },
    ])
    setSelectedCourseId('')
    markItemsChanged()
  }

  const addMentorshipBlock = () => {
    const trimmed = msTitle.trim()
    if (trimmed.length < 3) {
      setMsError('Dê um título ao bloco de mentoria (mínimo 3 caracteres).')
      return
    }
    const sessions = Math.max(1, Math.min(20, Math.round(Number(msSessions) || 1)))
    setDraftItems((prev) => [
      ...prev,
      { key: nextKey(), type: 'MENTORSHIP', title: trimmed, description: msDescription.trim(), sessionCount: sessions },
    ])
    resetMentorshipForm()
    markItemsChanged()
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    setDraftItems((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
    markItemsChanged()
  }

  const removeItem = (index: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index))
    markItemsChanged()
  }

  const handleSubmit = async () => {
    const errs: TrackFormErrors = {}
    if (title.trim().length < 5) {
      errs.title = 'O título da trilha precisa de ao menos 5 caracteres.'
    }
    if (description.trim().length < 30) {
      errs.description = 'Descreva a trilha com pelo menos 30 caracteres.'
    }
    if (!category) {
      errs.category = 'Selecione a categoria da trilha.'
    }
    const priceNum = Number(price)
    if (price.trim() === '' || Number.isNaN(priceNum) || priceNum < 0) {
      errs.price = 'Informe um preço válido (0 = gratuita).'
    }
    if (draftItems.length === 0) {
      errs.items = 'Adicione ao menos um curso ou bloco de mentoria.'
    }
    setFormErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      const items: TrackItemInput[] = draftItems.map((d) =>
        d.type === 'COURSE'
          ? { type: 'COURSE', courseId: d.courseId }
          : { type: 'MENTORSHIP', title: d.title, description: d.description, sessionCount: d.sessionCount }
      )
      if (editing) {
        await api.updateTrack(editing.id, {
          userId,
          title: title.trim(),
          description: description.trim(),
          category,
          level,
          price: priceNum,
          coverUrl,
          items, // na edição os itens são sempre reenviados (substituição completa)
        })
        toast.success('Trilha atualizada!')
      } else {
        await api.createTrack({
          userId,
          title: title.trim(),
          description: description.trim(),
          category,
          level,
          price: priceNum,
          coverUrl,
          items,
        })
        toast.success('Trilha criada!')
      }
      setDialogOpen(false)
      await refreshAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar a trilha.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (track: TrackListItemDTO) => {
    setTogglingId(track.id)
    try {
      await api.updateTrack(track.id, { userId, isPublished: !track.isPublished })
      toast.success(
        track.isPublished
          ? 'Trilha movida para rascunho.'
          : 'Trilha publicada! Ela já aparece no Explorar.'
      )
      await refreshAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar a trilha.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.deleteTrack(toDelete.id, userId)
      toast.success('Trilha excluída.')
      setToDelete(null)
      await refreshAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir a trilha.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-100">
            <Route className="size-4" aria-hidden />
          </span>
          Minhas trilhas
        </CardTitle>
        <CardDescription>
          Agrupe cursos e mentorias em jornada completas — perfeito para quem quer um caminho guiado.
        </CardDescription>
        <CardAction>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" aria-hidden /> Nova trilha
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-stone-300 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 ring-1 ring-stone-200">
              <Route className="size-6" aria-hidden />
            </div>
            <h3 className="mt-2 text-base font-semibold">Nenhuma trilha criada</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Combine cursos existentes e blocos de mentoria em uma jornada guiada, com começo, meio e fim.
            </p>
          </div>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar]:w-1.5">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white p-4"
              >
                {track.coverUrl ? (
                  <img
                    src={track.coverUrl}
                    alt=""
                    className="h-12 w-20 shrink-0 rounded-lg object-cover ring-1 ring-stone-200"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-stone-200 text-stone-600">
                      {track.category}
                    </Badge>
                    <Badge variant="outline" className="border-stone-200 text-stone-500">
                      {LEVEL_LABELS[track.level] ?? track.level}
                    </Badge>
                    {track.isPublished ? (
                      <Badge className="bg-emerald-100 text-emerald-800">Publicado</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-stone-100 text-stone-600">
                        Rascunho
                      </Badge>
                    )}
                  </div>
                  <h4 className="mt-2 font-semibold leading-snug">{track.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {track.courseCount} {track.courseCount === 1 ? 'curso' : 'cursos'} ·{' '}
                    {track.mentorshipSessions}{' '}
                    {track.mentorshipSessions === 1 ? 'mentoria' : 'mentorias'} ·{' '}
                    {track.price === 0 ? 'Gratuita' : currencyBRL(track.price)} · {track.studentCount}{' '}
                    {track.studentCount === 1 ? 'aluno' : 'alunos'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar trilha ${track.title}`}
                    onClick={() => openEdit(track)}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={togglingId === track.id}
                    aria-label={
                      track.isPublished ? `Despublicar trilha ${track.title}` : `Publicar trilha ${track.title}`
                    }
                    onClick={() => void togglePublish(track)}
                  >
                    {track.isPublished ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Excluir trilha ${track.title}`}
                    onClick={() => setToDelete(track)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog: nova/editar trilha */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (open) setFormErrors({})
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar trilha' : 'Nova trilha'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize as informações e a ordem dos itens da jornada.'
                : 'Monte a jornada escolhendo cursos seus e blocos de mentoria 1:1.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="track-title">Título</Label>
              <Input
                id="track-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Trilha completa de Produto: do zero ao PM pleno"
                aria-invalid={Boolean(formErrors.title)}
              />
              {formErrors.title ? <p className="text-xs text-rose-600">{formErrors.title}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="track-description">Descrição</Label>
              <Textarea
                id="track-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Quem é esta trilha, o que ela destrava e como a jornada funciona..."
                aria-invalid={Boolean(formErrors.description)}
              />
              {formErrors.description ? (
                <p className="text-xs text-rose-600">{formErrors.description}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="track-category">Categoria</Label>
                <Select
                  value={category}
                  onValueChange={(value) => {
                    setCategory(value)
                    setFormErrors((prev) => ({ ...prev, category: undefined }))
                  }}
                >
                  <SelectTrigger id="track-category" className="w-full" aria-invalid={Boolean(formErrors.category)}>
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
                <Label htmlFor="track-level">Nível</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger id="track-level" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACK_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {LEVEL_LABELS[l] ?? l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="track-price">Preço (R$)</Label>
              <Input
                id="track-price"
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
                <p className="text-xs text-muted-foreground">Deixe 0 para tornar a trilha gratuita.</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Capa da trilha</Label>
              {coverUrl ? (
                <div className="h-24 w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                  <img src={coverUrl} alt="Capa da trilha" className="h-full w-full object-cover" />
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
                    <Label htmlFor="track-cover-upload" className="cursor-pointer">
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
                  id="track-cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  tabIndex={-1}
                  onChange={(event) => {
                    void handleCoverFile(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </div>
            </div>

            {/* Itens da trilha */}
            <div className="flex flex-col gap-2">
              <Label>Itens da trilha</Label>
              <p className="text-xs text-muted-foreground">
                Os alunos percorrem os itens de cima para baixo — use as setas para ordenar a jornada.
              </p>
              {draftItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-300 px-4 py-5 text-center text-sm text-stone-400">
                  Adicione cursos e blocos de mentoria para montar a jornada.
                </p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {draftItems.map((item, index) => (
                    <li
                      key={item.key}
                      className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2"
                    >
                      <Badge
                        variant="outline"
                        className={
                          item.type === 'COURSE'
                            ? 'border-stone-200 text-stone-600'
                            : 'border-teal-200 bg-teal-50 text-teal-700'
                        }
                      >
                        {item.type === 'COURSE' ? 'Curso' : 'Mentoria'}
                      </Badge>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">
                        {item.title}
                      </span>
                      {item.type === 'MENTORSHIP' ? (
                        <span className="shrink-0 text-xs text-stone-400">
                          {item.sessionCount} {item.sessionCount === 1 ? 'sessão' : 'sessões'}
                        </span>
                      ) : null}
                      <div className="flex shrink-0 items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Mover ${item.title} para cima`}
                          disabled={index === 0}
                          onClick={() => moveItem(index, -1)}
                        >
                          <ChevronUp className="size-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Mover ${item.title} para baixo`}
                          disabled={index === draftItems.length - 1}
                          onClick={() => moveItem(index, 1)}
                        >
                          <ChevronDown className="size-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Remover ${item.title} da trilha`}
                          onClick={() => removeItem(index)}
                        >
                          <X className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              {formErrors.items ? <p className="text-xs text-rose-600">{formErrors.items}</p> : null}

              {/* Adicionar curso */}
              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="w-full" aria-label="Selecionar curso para adicionar à trilha">
                    <SelectValue
                      placeholder={
                        loadingCourses
                          ? 'Carregando cursos…'
                          : mentorCourses.length === 0
                            ? 'Você ainda não tem cursos'
                            : 'Selecione um curso seu'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {mentorCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                        {course.isPublished ? '' : ' (rascunho)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 sm:h-9"
                  disabled={!selectedCourseId}
                  onClick={addCourse}
                >
                  <Plus className="size-4" aria-hidden /> Adicionar
                </Button>
              </div>

              {/* Adicionar bloco de mentoria */}
              <div className="mt-1 rounded-xl border border-stone-200 bg-stone-50/60 p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_5.5rem]">
                  <div className="flex flex-col gap-1">
                    <Input
                      value={msTitle}
                      onChange={(event) => {
                        setMsTitle(event.target.value)
                        if (msError) setMsError('')
                      }}
                      placeholder="Ex.: Mentoria de alinhamento de carreira"
                      aria-label="Título do bloco de mentoria"
                      aria-invalid={Boolean(msError)}
                    />
                    {msError ? <p className="text-xs text-rose-600">{msError}</p> : null}
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    step={1}
                    value={msSessions}
                    onChange={(event) => setMsSessions(event.target.value)}
                    aria-label="Número de sessões do bloco de mentoria"
                  />
                </div>
                <Textarea
                  rows={2}
                  value={msDescription}
                  onChange={(event) => setMsDescription(event.target.value)}
                  placeholder="Descrição curta: o que será trabalhado nessas sessões..."
                  aria-label="Descrição do bloco de mentoria"
                  className="mt-2"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={addMentorshipBlock}
                >
                  <Plus className="size-4" aria-hidden /> Adicionar bloco de mentoria
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar trilha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: excluir trilha */}
      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir trilha?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.title}&quot; remove a trilha e todos os itens dela. Os cursos em si não são
              apagados e continuam disponíveis no painel. Esta ação não pode ser desfeita.
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
