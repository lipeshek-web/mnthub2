'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  MessageCircle,
  MessagesSquare,
  Search,
  Send,
  UserRound,
} from 'lucide-react'
import { api } from '@/lib/api'
import { normalizeText } from '@/lib/helpers'
import type { MessageDTO, ThreadDTO } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { Avatar } from '@/components/platform/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const MAX_BODY = 2000

/** HH:mm de hoje, dd/mm para dias anteriores */
function timeLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  if (sameDay) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function MessagesView({ initialPeerId }: { initialPeerId?: string }) {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const userId = user?.id

  const [threads, setThreads] = useState<ThreadDTO[]>([])
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const [activePeerId, setActivePeerId] = useState<string | null>(initialPeerId ?? null)
  const [activeThread, setActiveThread] = useState<ThreadDTO | null>(null)
  const [activeHeadline, setActiveHeadline] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageDTO[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)

  const listEndRef = useRef<HTMLDivElement | null>(null)
  const aliveRef = useRef(true)

  // ---------- Caixa de entrada ----------
  const loadThreads = useCallback(async () => {
    if (!userId) return
    try {
      const res = await api.listThreads(userId)
      if (!aliveRef.current) return
      setThreads(res.threads)
    } catch {
      /* silencioso: lista simplesmente permanece */
    } finally {
      if (aliveRef.current) setThreadsLoading(false)
    }
  }, [userId])

  // ---------- Thread ativa ----------
  const loadThread = useCallback(
    async (peerId: string, markReadLocally = true) => {
      if (!userId) return
      setMessagesLoading(true)
      try {
        const res = await api.listMessages(userId, peerId)
        if (!aliveRef.current) return
        setActivePeerId(res.peer.id)
        setActiveHeadline(res.peer.headline ?? null)
        setMessages(res.items)
        if (markReadLocally) {
          setThreads((prev) =>
            prev.map((t) => (t.peer.id === peerId ? { ...t, unread: 0 } : t))
          )
        }
      } catch {
        if (aliveRef.current) setMessages([])
      } finally {
        if (aliveRef.current) setMessagesLoading(false)
      }
    },
    [userId]
  )

  useEffect(() => {
    aliveRef.current = true
    if (!userId) return
    loadThreads()
    if (initialPeerId) {
      setMobileChatOpen(true)
      loadThread(initialPeerId, false)
    }
    return () => {
      aliveRef.current = false
    }
  }, [userId, loadThreads, loadThread, initialPeerId])

  // Polling: conversas a cada 15s; thread aberta a cada 4s
  useEffect(() => {
    if (!userId) return
    const t1 = setInterval(() => {
      if (!document.hidden) loadThreads()
    }, 15_000)
    return () => clearInterval(t1)
  }, [userId, loadThreads])

  useEffect(() => {
    if (!userId || !activePeerId) return
    const t2 = setInterval(() => {
      if (!document.hidden) loadThread(activePeerId, false)
    }, 4_000)
    return () => clearInterval(t2)
  }, [userId, activePeerId, loadThread])

  // Mantém metadados da thread ativa (nome/avatar) sincronizados com a lista
  useEffect(() => {
    if (!activePeerId) return
    const found = threads.find((t) => t.peer.id === activePeerId)
    if (found) setActiveThread(found)
  }, [threads, activePeerId])

  // Rolagem para a última mensagem
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, activePeerId])

  const openThread = (t: ThreadDTO) => {
    setActivePeerId(t.peer.id)
    setActiveThread(t)
    setActiveHeadline(null)
    setMessages([])
    setMobileChatOpen(true)
    loadThread(t.peer.id)
  }

  const send = async () => {
    const text = draft.trim()
    if (!userId || !activePeerId || !text || sending) return
    setSending(true)
    setDraft('')
    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: tempId, body: text, mine: true, read: false, createdAt: new Date().toISOString() },
    ])
    try {
      const saved = await api.sendMessage(userId, activePeerId, text)
      if (!aliveRef.current) return
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)))
      loadThreads()
    } catch {
      if (!aliveRef.current) return
      // Falhou: remove o otimista e devolve o rascunho
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setDraft(text)
    } finally {
      if (aliveRef.current) setSending(false)
    }
  }

  const filteredThreads = useMemo(() => {
    const q = normalizeText(filter.trim())
    if (!q) return threads
    return threads.filter((t) => normalizeText(t.peer.name).includes(q))
  }, [threads, filter])

  if (!user) return null

  const peerMeta = activeThread?.peer

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 sm:text-2xl">
            Mensagens
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Converse com mentores antes de agendar sua sessão.
          </p>
        </div>
      </div>

      <div className="grid h-[calc(100dvh-13.5rem)] min-h-80 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900 md:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        {/* ---------- Lista de conversas ---------- */}
        <aside
          className={cn(
            'flex min-h-0 flex-col border-stone-200 dark:border-stone-800',
            mobileChatOpen ? 'hidden md:flex' : 'flex',
            'md:border-r'
          )}
        >
          <div className="border-b border-stone-100 p-3 dark:border-stone-800">
            <div className="relative">
              <Search
                aria-hidden
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrar conversas..."
                aria-label="Filtrar conversas"
                className="h-9 rounded-full pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
            {threadsLoading ? (
              <div className="space-y-3 p-3" aria-busy="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                  <MessagesSquare className="h-5 w-5 text-stone-400" aria-hidden />
                </span>
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                  {filter ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                </p>
                {!filter && (
                  <>
                    <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                      Abra o perfil de um mentor e toque em <strong>Conversar</strong> para
                      tirar dúvidas antes de agendar.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => navigate({ name: 'marketplace' })}
                    >
                      Explorar mentores
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <ul role="list" aria-label="Conversas">
                {filteredThreads.map((t) => {
                  const active = t.peer.id === activePeerId
                  return (
                    <li key={t.peer.id}>
                      <button
                        type="button"
                        onClick={() => openThread(t)}
                        aria-current={active ? 'true' : undefined}
                        className={cn(
                          'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors',
                          active
                            ? 'bg-emerald-50 dark:bg-emerald-900/25'
                            : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'
                        )}
                      >
                        <Avatar name={t.peer.name} src={t.peer.avatarUrl} size="md" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                              {t.peer.name}
                            </span>
                            <span className="shrink-0 text-[10px] text-stone-400 dark:text-stone-500">
                              {timeLabel(t.lastAt)}
                            </span>
                          </span>
                          <span className="mt-0.5 flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                'truncate text-xs',
                                t.unread > 0
                                  ? 'font-semibold text-stone-800 dark:text-stone-100'
                                  : 'text-stone-500 dark:text-stone-400'
                              )}
                            >
                              {t.lastMine ? 'Você: ' : ''}
                              {t.lastBody}
                            </span>
                            {t.unread > 0 && (
                              <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold leading-none text-white">
                                {t.unread > 99 ? '99+' : t.unread}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ---------- Painel da conversa ---------- */}
        <section
          className={cn(
            'flex min-h-0 min-w-0 flex-col',
            mobileChatOpen ? 'flex' : 'hidden md:flex'
          )}
          aria-label="Conversa"
        >
          {!activePeerId ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700/10 dark:bg-emerald-500/10">
                <MessageCircle className="h-6 w-6 text-emerald-700 dark:text-emerald-400" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                Selecione uma conversa
              </p>
              <p className="max-w-xs text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                Suas mensagens com mentores aparecem aqui. Converse antes de reservar para
                garantir que a mentoria é ideal para você.
              </p>
            </div>
          ) : (
            <>
              {/* Cabeçalho do chat */}
              <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setMobileChatOpen(false)}
                  aria-label="Voltar para a lista de conversas"
                  className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 md:hidden dark:text-stone-400 dark:hover:bg-stone-800"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                </button>
                {peerMeta ? (
                  <>
                    <Avatar name={peerMeta.name} src={peerMeta.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {peerMeta.name}
                        {peerMeta.isMentor && (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            Mentor
                          </Badge>
                        )}
                      </p>
                      {activeHeadline && (
                        <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                          {activeHeadline}
                        </p>
                      )}
                    </div>
                    {peerMeta.isMentor && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="hidden shrink-0 rounded-full sm:inline-flex"
                        onClick={() => navigate({ name: 'mentor', mentorId: peerMeta.id })}
                      >
                        <UserRound className="h-4 w-4" /> Ver perfil
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-medium text-stone-400">carregando…</p>
                )}
              </div>

              {/* Mensagens */}
              <div className="min-h-0 flex-1 overflow-y-auto bg-stone-50/60 px-4 py-4 [scrollbar-width:thin] dark:bg-stone-950/40">
                {messagesLoading && messages.length === 0 ? (
                  <div className="space-y-3" aria-busy="true">
                    <Skeleton className="h-10 w-2/3 rounded-2xl" />
                    <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
                    <Skeleton className="h-10 w-1/3 rounded-2xl" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="max-w-xs text-center text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                      Nenhuma mensagem ainda. Diga oi e tire suas dúvidas sobre a mentoria 👋
                    </p>
                  </div>
                ) : (
                  <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
                    {messages.map((m, i) => {
                      const prev = messages[i - 1]
                      const grouped =
                        prev && prev.mine === m.mine &&
                        new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() <
                          5 * 60_000
                      return (
                        <div
                          key={m.id}
                          className={cn('flex', m.mine ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm',
                              m.mine
                                ? 'rounded-br-md bg-emerald-700 text-white'
                                : 'rounded-bl-md border border-stone-200/70 bg-white text-stone-900 dark:border-stone-700/60 dark:bg-stone-800 dark:text-stone-100'
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p
                              className={cn(
                                'mt-0.5 text-right text-[10px]',
                                m.mine ? 'text-emerald-100/80' : 'text-stone-400 dark:text-stone-500',
                                grouped && 'sr-only'
                              )}
                            >
                              {timeLabel(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={listEndRef} aria-hidden />
                  </div>
                )}
              </div>

              {/* Entrada de mensagem */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send()
                }}
                className="flex items-center gap-2 border-t border-stone-100 p-3 dark:border-stone-800"
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, MAX_BODY))}
                  placeholder="Escreva sua mensagem..."
                  aria-label="Nova mensagem"
                  className="h-10 flex-1 rounded-full"
                  maxLength={MAX_BODY}
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Enviar mensagem"
                  disabled={!draft.trim() || sending}
                  className="h-10 w-10 shrink-0 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
