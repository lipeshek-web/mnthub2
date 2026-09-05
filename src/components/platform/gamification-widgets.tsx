'use client'

/**
 * Gamificação v2 — widgets do dashboard:
 * - DailyMissionsCard: missões de hoje (progresso ao vivo + coleta de XP) e o
 *   heatmap de consistência (estilo GitHub) para a ofensiva "virar orgulho".
 * - WeeklyRankingCard: top da semana por XP ganho desde a segunda-feira.
 *
 * Ambos falham em silêncio (render null) — gamificação é molho, nunca prato
 * principal: se o endpoint não existir ou a rede oscilar, o dashboard segue.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Flame,
  MessageCircle,
  NotebookPen,
  PlayCircle,
  Target,
  Trophy,
  Video,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import type { DailyMissionsDTO, LeaderboardDTO, MissionDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Ícone por missão (mapa client-side; o servidor manda só o id). */
const MISSION_ICONS: Record<string, LucideIcon> = {
  aula: PlayCircle,
  quiz: Target,
  evento: Video,
  mensagem: MessageCircle,
  anotacao: NotebookPen,
}

// ------------------------------ Missões de hoje -----------------------------

export function DailyMissionsCard() {
  const [data, setData] = useState<DailyMissionsDTO | null>(null)
  const [failed, setFailed] = useState(false)
  const [claiming, setClaiming] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await api.dailyMissions())
    } catch {
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleClaim = useCallback(
    async (mission: MissionDTO) => {
      setClaiming(mission.id)
      try {
        const res = await api.claimMission(mission.id)
        toast.success(`+${res.awarded} XP! Missão "${mission.title}" concluída 🎉`)
        await load()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível coletar a missão.')
      } finally {
        setClaiming(null)
      }
    },
    [load]
  )

  if (failed) return null

  return (
    <div
      role="group"
      aria-label="Missões de hoje"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-sm tabular-nums"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
        >
          <Target className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
            Missões de hoje
          </h2>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Complete e colete XP — renovam à meia-noite
          </p>
        </div>
      </div>

      {!data ? (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {data.missions.map((mission) => {
            const Icon = MISSION_ICONS[mission.id] ?? Zap
            const pct = Math.round((mission.progress / mission.target) * 100)
            return (
              <li
                key={mission.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-xl border p-3 sm:flex-nowrap',
                  mission.claimed
                    ? 'border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    mission.claimed
                      ? 'bg-amber-600 dark:bg-amber-500 text-white'
                      : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                  )}
                >
                  {mission.claimed ? <Check className="size-5" /> : <Icon className="size-5" />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-50">
                      {mission.title}
                    </p>
                    <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-950/50 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
                      +{mission.xp} XP
                    </span>
                  </div>
                  <p className="truncate text-xs text-stone-400 dark:text-stone-500">
                    {mission.description}
                  </p>
                  {mission.progress < mission.target ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress
                        value={pct}
                        aria-label={`${pct}% da missão ${mission.title}`}
                        className="h-1.5 max-w-40"
                      />
                      <span className="shrink-0 text-[11px] font-semibold text-stone-400 dark:text-stone-500">
                        {mission.progress}/{mission.target}
                      </span>
                    </div>
                  ) : null}
                </div>

                {mission.claimed ? (
                  <span className="shrink-0 text-xs font-bold text-amber-700 dark:text-amber-400">
                    Coletada ✓
                  </span>
                ) : mission.claimable ? (
                  <Button
                    size="sm"
                    className="h-9 shrink-0 px-4 font-extrabold"
                    disabled={claiming === mission.id}
                    onClick={() => void handleClaim(mission)}
                  >
                    {claiming === mission.id ? 'Coletando…' : 'Coletar'}
                  </Button>
                ) : (
                  <span className="shrink-0 text-xs font-semibold text-stone-400 dark:text-stone-500">
                    Em andamento…
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Heatmap de consistência — a ofensiva vira orgulho visual */}
      {data ? <ConsistencyHeatmap daily={data} /> : null}
    </div>
  )
}

/** Escala de cor do heatmap (0 → 4 níveis de esmeralda). */
function heatClass(xp: number): string {
  if (xp <= 0) return 'bg-stone-100 dark:bg-stone-800'
  if (xp < 10) return 'bg-amber-200 dark:bg-amber-900'
  if (xp < 20) return 'bg-amber-400 dark:bg-amber-700'
  if (xp < 40) return 'bg-amber-500 dark:bg-amber-600'
  return 'bg-amber-700 dark:bg-amber-400'
}

function ConsistencyHeatmap({ daily }: { daily: DailyMissionsDTO }) {
  // Grade de 13 semanas (91 dias) terminando hoje — estilo GitHub.
  const weeks = useMemo(() => {
    const byDay = new Map(daily.heatmap.days.map((d) => [d.date, d.xp]))
    const today = new Date()
    const cells: { date: string; xp: number }[] = []
    for (let i = 90; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      cells.push({ date: key, xp: byDay.get(key) ?? 0 })
    }
    // Colunas de 7 dias alinhadas à semana (dom..sab) — padding no começo.
    const pad = cells[0] ? new Date(`${cells[0].date}T12:00:00`).getDay() : 0
    const cols: (typeof cells)[] = []
    let col: typeof cells = pad > 0 ? new Array(pad).fill(null) : []
    for (const cell of cells) {
      col.push(cell)
      if (col.length === 7) {
        cols.push(col)
        col = []
      }
    }
    if (col.length > 0) cols.push(col)
    return cols
  }, [daily.heatmap.days])

  return (
    <div className="mt-4 border-t border-stone-100 dark:border-stone-800 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
          <Flame
            className={cn('size-3.5', daily.streak > 0 ? 'text-orange-500' : 'text-stone-300 dark:text-stone-600')}
            aria-hidden
          />
          {daily.streak > 0
            ? `Ofensiva de ${daily.streak} ${daily.streak === 1 ? 'dia' : 'dias'} — não quebre a corrente!`
            : 'Estude hoje para começar uma ofensiva'}
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500">
          {daily.heatmap.activeDays} {daily.heatmap.activeDays === 1 ? 'dia ativo' : 'dias ativos'} nos últimos 3 meses
        </p>
      </div>
      <div
        className="mt-3 flex gap-1 overflow-x-auto pb-1"
        role="img"
        aria-label={`Consistência de estudos: ${daily.heatmap.activeDays} dias ativos nos últimos 3 meses`}
      >
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, di) => {
              const cell = week[di]
              if (!cell) return <span key={di} className="size-3 rounded-[3px] bg-transparent" />
              return (
                <span
                  key={di}
                  title={`${cell.date}${cell.xp > 0 ? ` · ${cell.xp} XP` : ''}`}
                  className={cn('size-3 shrink-0 rounded-[3px]', heatClass(cell.xp))}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ------------------------------ Ranking da semana ---------------------------

const RANK_STYLES = [
  'bg-amber-400 text-white', // 1º ouro
  'bg-stone-300 text-stone-800', // 2º prata
  'bg-orange-300 text-orange-900', // 3º bronze
]

export function WeeklyRankingCard() {
  const [board, setBoard] = useState<LeaderboardDTO | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api
      .weeklyLeaderboard()
      .then(setBoard)
      .catch(() => setFailed(true))
  }, [])

  if (failed) return null

  const top = board?.items.slice(0, 8) ?? []

  return (
    <div
      role="group"
      aria-label="Ranking da semana"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-sm tabular-nums"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
        >
          <Trophy className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
            Ranking da semana
          </h2>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            XP ganho desde a segunda-feira — recomeça toda semana
          </p>
        </div>
      </div>

      {!board ? (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Ninguém pontuou ainda esta semana — conclua a primeira aula e apareça em 1º! 🚀
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-1.5">
          {top.map((entry, idx) => (
            <li
              key={entry.userId}
              className={cn(
                'flex items-center gap-3 rounded-xl p-2',
                idx === 0 && 'bg-amber-50 dark:bg-amber-950/30'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
                  idx < 3 ? RANK_STYLES[idx] : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                )}
              >
                {idx + 1}
              </span>
              <Avatar name={entry.name} src={entry.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-50">
                  {entry.name}
                </p>
                <p className="truncate text-[11px] font-semibold text-stone-400 dark:text-stone-500">
                  {entry.levelLabel}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-sm font-extrabold text-amber-700 dark:text-amber-400">
                <Zap className="size-3.5" aria-hidden />+{entry.weekXp}
              </span>
            </li>
          ))}
        </ol>
      )}

      {/* Minha posição — sempre visível (mesmo fora do top) */}
      {board?.me ? (
        <div className="mt-4 border-t border-stone-100 dark:border-stone-800 pt-3">
          {board.me.rank > 0 ? (
            <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-stone-900 dark:text-stone-50">
              <Trophy className="size-4 text-amber-500" aria-hidden />
              Você está em {board.me.rank}º lugar
              <span className="font-semibold text-stone-400 dark:text-stone-500">
                com +{board.me.weekXp} XP esta semana
              </span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">
              Você ainda não pontuou esta semana — conclua uma aula e entre no ranking! ✨
            </p>
          )}
          {board.totalActive > 0 ? (
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
              {board.totalActive} {board.totalActive === 1 ? 'membro pontuou' : 'membros pontuaram'} esta semana
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
