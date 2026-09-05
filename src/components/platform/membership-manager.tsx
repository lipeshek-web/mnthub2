'use client'

// Aba "Assinatura" do painel do mentor — plano mensal de membrosia (1 por mentor).
// O aluno assina, tem acesso a TODOS os cursos publicados + sessão em grupo mensal.

import { useCallback, useEffect, useState } from 'react'
import {
  CalendarClock,
  CreditCard,
  Layers,
  Loader2,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import { groupSessionLabel } from '@/lib/membership-serialize'
import type { MembershipDTO } from '@/lib/types'

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const dayMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

export function MembershipManager({ userId }: { userId: string }) {
  const loadingTuple = useState(true)
  const loading = loadingTuple[0]
  const setLoading = loadingTuple[1]
  const membershipTuple = useState<MembershipDTO | null>(null)
  const membership = membershipTuple[0]
  const setMembership = membershipTuple[1]

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [sessionDay, setSessionDay] = useState('3')
  const [sessionTime, setSessionTime] = useState('19:00')
  const [isPublished, setIsPublished] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.listMemberships({ mentorUserId: userId })
      const m = res.memberships[0] ?? null
      setMembership(m)
      if (m) {
        setTitle(m.title)
        setDescription(m.description)
        setPrice(String(m.price))
        setSessionDay(String(m.groupSessionDay))
        setSessionTime(m.groupSessionTime)
        setIsPublished(m.isPublished)
      }
      setConfirmingDelete(false)
    } catch {
      toast.error('Não foi possível carregar sua assinatura.')
    } finally {
      setLoading(false)
    }
  }, [userId, setLoading, setMembership])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    if (saving) return
    const parsed = Number(price.replace(',', '.'))
    if (!title.trim()) {
      toast.error('Dê um nome ao seu plano (ex: "Clube Arquiteto").')
      return
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Informe uma mensalidade maior que zero.')
      return
    }
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(sessionTime)) {
      toast.error('Hora inválida — use o formato HH:mm (ex: 19:00).')
      return
    }
    setSaving(true)
    try {
      await api.saveMembership({
        userId,
        id: membership?.id,
        title: title.trim(),
        description: description.trim(),
        price: parsed,
        groupSessionDay: Number(sessionDay),
        groupSessionTime: sessionTime,
        isPublished,
      })
      toast.success(
        membership ? 'Assinatura atualizada!' : 'Assinatura criada — já aparece no seu perfil!'
      )
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar a assinatura.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!membership || saving) return
    setSaving(true)
    try {
      await api.deleteMembership(membership.id, userId)
      toast.success('Assinatura excluída.')
      setTitle('')
      setDescription('')
      setPrice('')
      setSessionDay('3')
      setSessionTime('19:00')
      setIsPublished(true)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-w-0 flex-col gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  const subscribers = membership?.subscribers ?? []
  const activeSubs = subscribers.filter((s) => s.status === 'ACTIVE')
  const mrr = membership ? membership.price * activeSubs.length : 0

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section aria-labelledby="membership-title">
        <h2 id="membership-title" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <CreditCard aria-hidden className="h-5 w-5 text-amber-700 dark:text-amber-300" />
          Assinatura mensal
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Renda recorrente: quem assina tem acesso a <strong>todos os seus cursos publicados</strong>{' '}
          (inclusive os próximos) e à <strong>sessão em grupo mensal</strong>.
        </p>
      </section>

      {/* KPIs */}
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="gap-1 rounded-2xl py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
              <Users aria-hidden className="h-4.5 w-4.5 text-amber-700 dark:text-amber-300" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-none">{activeSubs.length}</p>
              <p className="truncate text-xs text-muted-foreground">assinantes ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-1 rounded-2xl py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
              <Wallet aria-hidden className="h-4.5 w-4.5 text-amber-700 dark:text-amber-300" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-none">{brl(mrr)}</p>
              <p className="truncate text-xs text-muted-foreground">receita mensal recorrente</p>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-1 rounded-2xl py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
              <Layers aria-hidden className="h-4.5 w-4.5 text-amber-700 dark:text-amber-300" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-none">{membership?.coursesCount ?? 0}</p>
              <p className="truncate text-xs text-muted-foreground">cursos inclusos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário */}
      <Card className="rounded-2xl">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">
            {membership ? 'Editar plano' : 'Criar plano de assinatura'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              id="membership-published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
              aria-label="Publicar assinatura"
            />
            <Label htmlFor="membership-published" className="text-sm font-medium">
              {isPublished ? 'Publicado' : 'Rascunho'}
            </Label>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="membership-title">Nome do plano</Label>
            <Input
              id="membership-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Ex: "Clube Arquiteto de Software"'
              maxLength={80}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="membership-desc">Descrição</Label>
            <Textarea
              id="membership-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que está incluído e para quem é o plano."
              rows={3}
              maxLength={500}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="membership-price">Mensalidade (R$)</Label>
              <Input
                id="membership-price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="49,90"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="membership-day">Sessão em grupo</Label>
              <Select value={sessionDay} onValueChange={setSessionDay}>
                <SelectTrigger id="membership-day" className="h-11 w-full rounded-xl">
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((d, i) => (
                    <SelectItem key={d} value={String(i)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="membership-time">Hora</Label>
              <Input
                id="membership-time"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                placeholder="19:00"
                maxLength={5}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => void save()}
              disabled={saving}
              className="h-11 rounded-full px-6 font-bold"
            >
              {saving && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
              {membership ? 'Salvar alterações' : 'Criar assinatura'}
            </Button>
            {membership &&
              (confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => void remove()}
                    disabled={saving}
                    className="h-11 rounded-full px-4 font-bold"
                  >
                    Confirmar exclusão
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmingDelete(false)}
                    className="h-11 rounded-full px-4"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setConfirmingDelete(true)}
                  className="h-11 gap-1.5 rounded-full px-4 text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                  Excluir plano
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Prévia do que o aluno vê */}
      {title.trim() && (
        <Card className="rounded-2xl border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30">
          <CardContent className="grid gap-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge className="rounded-full border border-amber-200 dark:border-amber-900 bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-300 hover:bg-white dark:hover:bg-stone-900">
                  <CreditCard aria-hidden className="h-3 w-3" /> Assinatura
                </Badge>
                {!isPublished && (
                  <Badge variant="outline" className="rounded-full">
                    Rascunho
                  </Badge>
                )}
              </div>
              <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300">
                {Number.isFinite(Number(price.replace(',', '.')))
                  ? `${brl(Number(price.replace(',', '.')))}/mês`
                  : '—'}
              </p>
            </div>
            <p className="text-base font-bold">{title}</p>
            {description.trim() && (
              <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {description}
              </p>
            )}
            <ul className="grid gap-1.5 text-sm text-stone-600 dark:text-stone-400">
              <li className="flex items-center gap-1.5">
                <Layers aria-hidden className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Todos os {membership?.coursesCount ?? 0} cursos publicados (e os próximos)
              </li>
              <li className="flex items-center gap-1.5">
                <CalendarClock aria-hidden className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Sessão em grupo mensal ·{' '}
                {groupSessionLabel(Number(sessionDay) || 0, sessionTime)}
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Cancele quando quiser — acesso até o fim do ciclo pago
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Assinantes */}
      {membership && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">
              Assinantes{' '}
              <span className="font-normal text-muted-foreground">({subscribers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {subscribers.length === 0 && (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhum assinante ainda. Divulgue o plano no seu perfil e nas páginas dos cursos.
              </p>
            )}
            {subscribers.map((s) => (
              <div
                key={s.id}
                className="flex min-w-0 items-center gap-3 rounded-xl border p-3"
              >
                <Avatar name={s.name} src={s.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    desde {dayMonth(s.startedAt)} ·{' '}
                    {s.status === 'EXPIRED'
                      ? `expirou ${dayMonth(s.renewsAt)}`
                      : `renova ${dayMonth(s.renewsAt)}`}
                  </p>
                </div>
                {s.status === 'ACTIVE' ? (
                  <Badge className="rounded-full border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50">
                    Ativo
                  </Badge>
                ) : s.status === 'EXPIRED' ? (
                  <Badge variant="outline" className="rounded-full border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                    Expirada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full">
                    Cancelado
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
