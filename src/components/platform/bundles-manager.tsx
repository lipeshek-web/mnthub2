'use client'

// Gerenciador de Pacotes de cursos (bundles) — painel do mentor.
// Pacote = 2+ cursos próprios vendidos juntos por um preço com desconto.
// O desconto é implícito: % = 1 - preço do pacote / soma dos preços.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BadgePercent,
  BookOpen,
  Check,
  Layers,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { avatarGradient, currencyBRL } from '@/lib/helpers'
import type { BundleDTO, CourseListItemDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

const brl2 = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

interface EditingState {
  id?: string
  title: string
  description: string
  price: string
  courseIds: string[]
  isPublished: boolean
}

const emptyForm: EditingState = {
  title: '',
  description: '',
  price: '',
  courseIds: [],
  isPublished: true,
}

function BundlesManager({ userId }: { userId: string }) {
  const [bundles, setBundles] = useState<BundleDTO[]>([])
  const [courses, setCourses] = useState<CourseListItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toDelete, setToDelete] = useState<BundleDTO | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EditingState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [bundleRes, courseRes] = await Promise.all([
      api.listBundles({ mentorUserId: userId }),
      api.listCourses({ mentorUserId: userId }),
    ])
    setBundles(bundleRes.bundles)
    setCourses(courseRes)
  }, [userId])

  useEffect(() => {
    let active = true
    reload()
      .catch((err: unknown) => {
        if (active) toast.error(err instanceof Error ? err.message : 'Não foi possível carregar seus pacotes.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reload])

  // Publicados primeiro (rascunhos no fim)
  const sortedBundles = useMemo(
    () =>
      [...bundles].sort((a, b) => Number(b.isPublished) - Number(a.isPublished)),
    [bundles]
  )

  const selectableCourses = useMemo(
    () => courses.filter((c) => c.isPublished || editing.courseIds.includes(c.id)),
    [courses, editing.courseIds]
  )

  const selectedTotal = useMemo(
    () =>
      editing.courseIds.reduce((acc, id) => {
        const c = courses.find((x) => x.id === id)
        return acc + (c?.price ?? 0)
      }, 0),
    [courses, editing.courseIds]
  )
  const parsedPrice = Number(editing.price.replace(',', '.')) || 0
  const discountPercent =
    selectedTotal > 0 && parsedPrice > 0
      ? Math.max(0, Math.round((1 - parsedPrice / selectedTotal) * 100))
      : 0

  const openCreate = () => {
    setEditing(emptyForm)
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (b: BundleDTO) => {
    setEditing({
      id: b.id,
      title: b.title,
      description: b.description,
      price: String(b.price).replace('.', ','),
      courseIds: b.courses.map((c) => c.id),
      isPublished: b.isPublished,
    })
    setFormError(null)
    setFormOpen(true)
  }

  const toggleCourse = (id: string) => {
    setEditing((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(id)
        ? prev.courseIds.filter((c) => c !== id)
        : [...prev.courseIds, id],
    }))
  }

  const handleSave = async () => {
    if (editing.title.trim().length < 3) {
      setFormError('Dê um nome ao pacote (mín. 3 caracteres).')
      return
    }
    if (editing.courseIds.length < 2) {
      setFormError('Escolha pelo menos 2 cursos para o pacote.')
      return
    }
    if (!editing.price.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Informe um preço válido para o pacote.')
      return
    }
    setFormError(null)
    setSaving(true)
    try {
      await api.saveBundle({
        userId,
        id: editing.id,
        title: editing.title.trim(),
        description: editing.description.trim(),
        price: parsedPrice,
        courseIds: editing.courseIds,
        isPublished: editing.isPublished,
      })
      toast.success(editing.id ? 'Pacote atualizado!' : 'Pacote criado! 🎉')
      setFormOpen(false)
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o pacote.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.deleteBundle(toDelete.id, userId)
      toast.success('Pacote excluído.')
      setToDelete(null)
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir o pacote.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-900/40">
            <Layers className="size-4" aria-hidden />
          </span>
          Pacotes de cursos
        </CardTitle>
        <CardDescription>
          Combine 2 ou mais cursos seus em um pacote com preço especial — ticket médio maior e mais
          valor para o aluno.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button onClick={openCreate} className="h-11 rounded-full font-bold">
            <Plus aria-hidden className="h-4 w-4" />
            Criar pacote
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3" aria-busy="true">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <span className="sr-only">Carregando pacotes…</span>
          </div>
        ) : sortedBundles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
              <Package aria-hidden className="h-6 w-6 text-stone-400 dark:text-stone-500" />
            </span>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-50">
              Nenhum pacote ainda
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              Ex.: “Fundamentos + Projeto Prático” por R$ 199 no lugar de R$ 258. Crie o primeiro
              agora mesmo.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sortedBundles.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate font-bold text-stone-900 dark:text-stone-50">{b.title}</p>
                      {b.isPublished ? (
                        <Badge className="rounded-full border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400">
                          Rascunho
                        </Badge>
                      )}
                    </div>
                    {b.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">
                        {b.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(b)}
                      className="h-9 gap-1.5 rounded-full px-3"
                    >
                      <Pencil aria-hidden className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToDelete(b)}
                      className="h-9 w-9 rounded-full p-0 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      aria-label={`Excluir pacote ${b.title}`}
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Cursos do pacote */}
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {b.courses.map((c) => (
                    <li
                      key={c.id}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 py-1 pl-1 pr-2.5 text-xs font-medium text-stone-700 dark:text-stone-300"
                    >
                      {c.coverUrl ? (
                        <img
                          src={c.coverUrl}
                          alt=""
                          className="h-5 w-5 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <BookOpen aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span className="truncate">{c.title}</span>
                    </li>
                  ))}
                </ul>

                {/* Preço */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-extrabold text-stone-900 dark:text-stone-50">
                    {b.price === 0 ? 'Gratuito' : brl2(b.price)}
                  </span>
                  {b.coursesTotal > b.price && b.price > 0 ? (
                    <>
                      <span className="text-stone-400 dark:text-stone-500 line-through">
                        {brl2(b.coursesTotal)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <BadgePercent aria-hidden className="h-3 w-3" />
                        −{b.discountPercent}%
                      </span>
                    </>
                  ) : null}
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    {b.courseCount} {b.courseCount === 1 ? 'curso' : 'cursos'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* Dialog criar/editar */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Editar pacote' : 'Criar pacote de cursos'}</DialogTitle>
            <DialogDescription>
              Selecione seus cursos, defina o preço do pacote e publique — o desconto é calculado
              automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bundle-title">Nome do pacote</Label>
              <Input
                id="bundle-title"
                value={editing.title}
                onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex.: Formação completa em Produto"
                maxLength={80}
                aria-invalid={Boolean(formError)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bundle-description">Descrição (opcional)</Label>
              <Textarea
                id="bundle-description"
                value={editing.description}
                onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
                placeholder="O que o aluno leva ao comprar o pacote completo…"
                rows={2}
                maxLength={500}
              />
            </div>

            {/* Seleção de cursos */}
            <div className="flex flex-col gap-2">
              <Label>
                Cursos do pacote{' '}
                <span className="font-normal text-stone-400 dark:text-stone-500">
                  (mínimo 2 · {editing.courseIds.length} selecionados)
                </span>
              </Label>
              {selectableCourses.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700 p-4 text-sm text-stone-500 dark:text-stone-400">
                  Você ainda não tem cursos publicados. Crie seus cursos primeiro.
                </p>
              ) : (
                <ul className="max-h-64 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800">
                  {selectableCourses.map((c) => {
                    const checked = editing.courseIds.includes(c.id)
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          onClick={() => toggleCourse(c.id)}
                          className="flex w-full items-center gap-3 p-2.5 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-900"
                        >
                          <span
                            className={cn(
                              'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                              checked
                                ? 'border-emerald-700 bg-emerald-700 text-white'
                                : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900'
                            )}
                          >
                            {checked && <Check aria-hidden className="h-3.5 w-3.5" />}
                          </span>
                          {c.coverUrl ? (
                            <img
                              src={c.coverUrl}
                              alt=""
                              className="h-9 w-12 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <span
                              aria-hidden
                              className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md"
                              style={avatarGradient(c.title)}
                            >
                              <BookOpen className="h-4 w-4 text-white/70" />
                            </span>
                          )}
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-900 dark:text-stone-50">
                            {c.title}
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-stone-500 dark:text-stone-400">
                            {c.price === 0 ? 'Gratuito' : currencyBRL(c.price)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Preço + resumo do desconto */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="bundle-price">Preço do pacote (R$)</Label>
                <Input
                  id="bundle-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.price}
                  onChange={(e) => setEditing((p) => ({ ...p, price: e.target.value }))}
                  placeholder={selectedTotal > 0 ? `Ex.: ${(selectedTotal * 0.8).toFixed(0)}` : '199'}
                  aria-invalid={Boolean(formError)}
                />
              </div>
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Valor cheio</span>
                  <span className="font-semibold text-stone-700 dark:text-stone-300 line-through">
                    {selectedTotal > 0 ? brl2(selectedTotal) : '—'}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Desconto</span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 font-bold',
                      discountPercent > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-400 dark:text-stone-500'
                    )}
                  >
                    {discountPercent > 0 && <BadgePercent aria-hidden className="h-3.5 w-3.5" />}
                    {selectedTotal > 0 ? `${discountPercent}%` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Publicar */}
            <div className="flex items-center justify-between rounded-xl border border-stone-200 dark:border-stone-800 p-3">
              <div>
                <Label htmlFor="bundle-published" className="text-sm">
                  Publicado
                </Label>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Visível no Explorar e nas páginas dos cursos.
                </p>
              </div>
              <Switch
                id="bundle-published"
                checked={editing.isPublished}
                onCheckedChange={(checked) => setEditing((p) => ({ ...p, isPublished: checked }))}
              />
            </div>

            {formError ? (
              <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">
                {formError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving} className="rounded-full font-bold">
              {saving && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
              {editing.id ? 'Salvar alterações' : 'Criar pacote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog excluir */}
      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Excluir pacote?</DialogTitle>
            <DialogDescription>
              “{toDelete?.title}” deixará de ser vendido. Alunos com cursos já comprados mantêm o
              acesso — apenas o pacote é removido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="rounded-full font-bold"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export { BundlesManager }
