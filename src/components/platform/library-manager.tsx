'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BookMarked,
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  Library,
  Pencil,
  Plus,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
import { CATEGORIES, LEVEL_LABELS, avatarGradient } from '@/lib/helpers'
import type { LibraryItemDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

const LEVELS = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'] as const
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

interface LibraryFormErrors {
  title?: string
  description?: string
  readingMin?: string
  content?: string
}

/** Nome "legível" a partir da URL do PDF (fallback quando não veio do upload atual) */
function pdfNameFromUrl(url: string): string {
  try {
    const raw = url.split('/').pop()?.split('?')[0] ?? ''
    return decodeURIComponent(raw) || 'arquivo.pdf'
  } catch {
    return 'arquivo.pdf'
  }
}

export function LibraryManager({
  userId,
  onChanged,
}: {
  userId: string
  onChanged?: () => void
}) {
  const [items, setItems] = useState<LibraryItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LibraryItemDTO | null>(null)
  const [toDelete, setToDelete] = useState<LibraryItemDTO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [kind, setKind] = useState<'ARTICLE' | 'BOOK'>('ARTICLE')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [level, setLevel] = useState<string>('INICIANTE')
  const [readingMin, setReadingMin] = useState('10')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfName, setPdfName] = useState('')
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [content, setContent] = useState('')
  const [formErrors, setFormErrors] = useState<LibraryFormErrors>({})

  const fetchLocal = useCallback(async (): Promise<LibraryItemDTO[]> => {
    const list = await api.listLibrary({ authorUserId: userId })
    setItems(list)
    return list
  }, [userId])

  useEffect(() => {
    let active = true
    fetchLocal()
      .catch((err: unknown) => {
        if (active) {
          toast.error(err instanceof Error ? err.message : 'Não foi possível carregar sua Biblioteca.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [fetchLocal])

  /** Recarrega a lista local e notifica o pai (contagens do perfil) */
  const refreshAll = useCallback(async () => {
    onChanged?.()
    await fetchLocal()
  }, [onChanged, fetchLocal])

  const openCreate = () => {
    setEditing(null)
    setKind('ARTICLE')
    setTitle('')
    setDescription('')
    setCategory('')
    setLevel('INICIANTE')
    setReadingMin('10')
    setCoverUrl(null)
    setPdfUrl(null)
    setPdfName('')
    setContent('')
    setFormErrors({})
    setDialogOpen(true)
  }

  const openEdit = (item: LibraryItemDTO) => {
    setEditing(item)
    setKind(item.kind === 'BOOK' ? 'BOOK' : 'ARTICLE')
    setTitle(item.title)
    setDescription(item.description)
    setCategory(item.category)
    setLevel(item.level)
    setReadingMin(String(item.readingMin))
    setCoverUrl(item.coverUrl ?? null)
    // pdfUrl/content não vêm no DTO de lista — busca o detalhe para preencher
    setPdfUrl(null)
    setPdfName('')
    setContent('')
    setFormErrors({})
    setDialogOpen(true)

    api
      .getLibraryItem(item.id, userId)
      .then((detail) => {
        if (detail.pdfUrl) {
          setPdfUrl(detail.pdfUrl)
          setPdfName(pdfNameFromUrl(detail.pdfUrl))
        }
        if (detail.content) setContent(detail.content)
      })
      .catch(() => {
        /* mantém o formulário com os dados do resumo */
      })
  }

  const handleCoverFile = async (file: File | null | undefined) => {
    if (!file || uploadingCover) return
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('A imagem deve ter no máximo 5MB.')
      return
    }
    setUploadingCover(true)
    try {
      const url = await api.uploadImage(file)
      setCoverUrl(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar a capa.')
    } finally {
      setUploadingCover(false)
    }
  }

  const handlePdfFile = async (file: File | null | undefined) => {
    if (!file || uploadingPdf) return
    if (file.type !== 'application/pdf') {
      toast.error('Envie um arquivo em formato PDF.')
      return
    }
    setUploadingPdf(true)
    try {
      const uploaded = await api.uploadAttachment(file)
      setPdfUrl(uploaded.url)
      setPdfName(uploaded.name)
      setFormErrors((prev) => ({ ...prev, content: undefined }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar o PDF.')
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleSubmit = async () => {
    const errs: LibraryFormErrors = {}
    if (title.trim().length < 3) {
      errs.title = 'O título precisa de ao menos 3 caracteres.'
    }
    if (description.trim().length < 20) {
      errs.description = 'Descreva o item com pelo menos 20 caracteres.'
    }
    const min = Math.round(Number(readingMin))
    if (!readingMin.trim() || Number.isNaN(min) || min < 1) {
      errs.readingMin = 'Informe o tempo de leitura (mínimo 1 minuto).'
    }
    // Livro exige PDF; artigo exige PDF OU texto
    if (kind === 'BOOK' && !pdfUrl) {
      errs.content = 'Para livros, envie o arquivo PDF.'
    } else if (kind === 'ARTICLE' && !pdfUrl && content.trim() === '') {
      errs.content = 'Envie um PDF ou escreva o texto do artigo.'
    }
    setFormErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      const payload = {
        userId,
        kind,
        title: title.trim(),
        description: description.trim(),
        category: category || 'Tecnologia',
        level,
        coverUrl,
        pdfUrl,
        content: content.trim() ? content : null,
        readingMin: min,
      }
      if (editing) {
        await api.updateLibraryItem(editing.id, payload)
        toast.success('Item atualizado!')
      } else {
        await api.createLibraryItem(payload)
        toast.success('Item adicionado à Biblioteca! 📚')
      }
      setDialogOpen(false)
      await refreshAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o item.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (item: LibraryItemDTO) => {
    setTogglingId(item.id)
    try {
      await api.updateLibraryItem(item.id, { userId, isPublished: !item.isPublished })
      toast.success(
        item.isPublished
          ? 'Item movido para rascunho.'
          : 'Item publicado! Ele já aparece no Explorar.'
      )
      await refreshAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar o item.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.deleteLibraryItem(toDelete.id, userId)
      toast.success('Item excluído da Biblioteca.')
      setToDelete(null)
      await refreshAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir o item.')
    } finally {
      setDeleting(false)
    }
  }

  const isBook = kind === 'BOOK'
  const contentLabel = isBook ? 'Texto do livro' : 'Texto do artigo'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-100">
            <Library className="size-4" aria-hidden />
          </span>
          Biblioteca
        </CardTitle>
        <CardDescription>
          Publique artigos e livros (PDF ou texto) como material de leitura — use-os em aulas de
          cursos ou ofereça à comunidade.
        </CardDescription>
        <CardAction>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" aria-hidden /> Novo item
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-stone-300 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-stone-100 ring-1 ring-stone-200">
              <Library className="size-6 text-stone-300" aria-hidden />
            </div>
            <h3 className="mt-2 text-base font-semibold">Nenhum item na sua Biblioteca ainda</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Publique artigos e livros para engajar alunos e atrair novos estudantes.
            </p>
            <Button size="sm" className="mt-2" onClick={openCreate}>
              <Plus className="size-4" aria-hidden /> Criar primeiro item
            </Button>
          </div>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar]:w-1.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white p-4"
              >
                {/* Thumb: capa ou gradiente determinístico + ícone do tipo */}
                {item.coverUrl ? (
                  <img
                    src={item.coverUrl}
                    alt=""
                    className="h-12 w-20 shrink-0 rounded-lg object-cover ring-1 ring-stone-200"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg"
                    style={avatarGradient(item.title)}
                  >
                    {item.kind === 'BOOK' ? (
                      <BookMarked className="h-5 w-5 text-white/40" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-white/40" />
                    )}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        item.kind === 'BOOK'
                          ? 'border-amber-200 bg-amber-50 text-amber-800'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      )}
                    >
                      {item.kind === 'BOOK' ? 'Livro' : 'Artigo'}
                    </Badge>
                    <Badge variant="outline" className="border-stone-200 text-stone-600">
                      {item.category}
                    </Badge>
                    {item.isPublished ? (
                      <Badge className="bg-emerald-100 text-emerald-800">Publicado</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-stone-100 text-stone-600">
                        Rascunho
                      </Badge>
                    )}
                  </div>
                  <h4 className="mt-2 font-semibold leading-snug">{item.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.readingMin} min · usado em {item.usageCount}{' '}
                    {item.usageCount === 1 ? 'aula' : 'aulas'}
                    {item.hasPdf ? ' · PDF' : ''}
                    {item.hasText ? ' · texto' : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${item.title}`}
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={togglingId === item.id}
                    aria-label={
                      item.isPublished ? `Despublicar ${item.title}` : `Publicar ${item.title}`
                    }
                    onClick={() => void togglePublish(item)}
                  >
                    {item.isPublished ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Excluir ${item.title}`}
                    onClick={() => setToDelete(item)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog: novo/editar item da Biblioteca */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (open) setFormErrors({})
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar item' : 'Novo item da Biblioteca'}</DialogTitle>
            <DialogDescription>
              {isBook
                ? 'Livros ficam disponíveis para leitura e download em PDF.'
                : 'Artigos podem ser texto escrito, PDF ou ambos.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {/* Tipo: Artigo | Livro */}
            <div className="flex flex-col gap-2">
              <Label>Tipo de conteúdo</Label>
              <RadioGroup
                value={kind}
                onValueChange={(value) => setKind(value === 'BOOK' ? 'BOOK' : 'ARTICLE')}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="lib-kind-article"
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                    kind === 'ARTICLE'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-200'
                      : 'border-stone-200 hover:border-stone-300'
                  )}
                >
                  <RadioGroupItem value="ARTICLE" id="lib-kind-article" className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
                      <BookOpen className="size-4 text-emerald-600" aria-hidden /> Artigo
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      Texto escrito, PDF ou ambos.
                    </span>
                  </span>
                </Label>
                <Label
                  htmlFor="lib-kind-book"
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                    kind === 'BOOK'
                      ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-200'
                      : 'border-stone-200 hover:border-stone-300'
                  )}
                >
                  <RadioGroupItem value="BOOK" id="lib-kind-book" className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
                      <BookMarked className="size-4 text-amber-600" aria-hidden /> Livro
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      PDF completo para leitura e download.
                    </span>
                  </span>
                </Label>
              </RadioGroup>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="lib-title">Título</Label>
              <Input
                id="lib-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={
                  isBook
                    ? 'Ex.: O guia prático do produto digital'
                    : 'Ex.: Como validar sua ideia em 7 dias'
                }
                aria-invalid={Boolean(formErrors.title)}
              />
              {formErrors.title ? <p className="text-xs text-rose-600">{formErrors.title}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lib-description">Descrição</Label>
              <Textarea
                id="lib-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Sobre o que é este conteúdo e por que vale a leitura..."
                aria-invalid={Boolean(formErrors.description)}
              />
              {formErrors.description ? (
                <p className="text-xs text-rose-600">{formErrors.description}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="lib-category">Categoria</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                >
                  <SelectTrigger id="lib-category" className="w-full">
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
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lib-level">Nível</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger id="lib-level" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {LEVEL_LABELS[l] ?? l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lib-reading-min">Tempo de leitura (minutos)</Label>
              <Input
                id="lib-reading-min"
                type="number"
                min={1}
                step={1}
                value={readingMin}
                onChange={(event) => setReadingMin(event.target.value)}
                aria-invalid={Boolean(formErrors.readingMin)}
              />
              {formErrors.readingMin ? (
                <p className="text-xs text-rose-600">{formErrors.readingMin}</p>
              ) : null}
            </div>

            {/* Capa (opcional) */}
            <div className="flex flex-col gap-2">
              <Label>Capa (opcional)</Label>
              {coverUrl ? (
                <div className="h-24 w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                  <img src={coverUrl} alt="Capa do item" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-stone-300 bg-stone-50">
                  <ImagePlus className="size-5 text-stone-400" aria-hidden />
                  <p className="text-xs text-stone-500">Capa recomendada para o card no Explorar</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {uploadingCover ? (
                  <Button type="button" size="sm" variant="outline" disabled>
                    Enviando...
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Label htmlFor="lib-cover-upload" className="cursor-pointer">
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
                  id="lib-cover-upload"
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

            {/* Conteúdo: PDF */}
            <div className="flex flex-col gap-2">
              <Label>{isBook ? 'Arquivo PDF do livro' : 'Arquivo PDF'}</Label>
              {pdfUrl ? (
                <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
                  <FileText className="size-4 shrink-0 text-rose-600" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm text-stone-700">
                    {pdfName || pdfNameFromUrl(pdfUrl)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remover PDF"
                    disabled={uploadingPdf}
                    onClick={() => {
                      setPdfUrl(null)
                      setPdfName('')
                    }}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                </div>
              ) : (
                <div>
                  {uploadingPdf ? (
                    <Button type="button" size="sm" variant="outline" disabled>
                      Enviando...
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Label htmlFor="lib-pdf-upload" className="cursor-pointer">
                        <FileText className="size-4" aria-hidden /> Enviar PDF
                      </Label>
                    </Button>
                  )}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {isBook
                      ? 'Obrigatório para livros — os alunos leem no próprio navegador.'
                      : 'Opcional para artigos — pode combinar com o texto abaixo.'}
                  </p>
                </div>
              )}
              <input
                id="lib-pdf-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                tabIndex={-1}
                onChange={(event) => {
                  void handlePdfFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </div>

            {/* Conteúdo: texto */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="lib-content">{contentLabel}</Label>
              <Textarea
                id="lib-content"
                rows={8}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value)
                  if (formErrors.content) {
                    setFormErrors((prev) => ({ ...prev, content: undefined }))
                  }
                }}
                placeholder={
                  isBook
                    ? 'Texto complementar ao PDF (opcional). Use linhas vazias para separar parágrafos, "## " para subtítulos e "- " para listas.'
                    : 'Escreva o texto do artigo aqui. Use linhas vazias para separar parágrafos, "## " para subtítulos e "- " para listas.'
                }
                aria-invalid={Boolean(formErrors.content)}
              />
              {formErrors.content ? (
                <p className="text-xs text-rose-600">{formErrors.content}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Pode enviar o PDF, escrever o texto ou ambos —{' '}
                  {isBook ? 'o PDF é obrigatório para livros.' : 'pelo menos um dos dois.'}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Publicar item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: excluir item */}
      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir &quot;{toDelete?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Aulas de cursos que usam este item ficarão sem material de leitura. Esta ação não
              pode ser desfeita.
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
