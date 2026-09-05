'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, CornerDownLeft, MessageCircleQuestion, Send, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AiTutorChatMessage, UserDTO } from '@/lib/types'

/* ==================== TUTOR IA DO CURSO ====================
   Botão flutuante na sala de aula que abre um chat: a IA responde
   dúvidas do aluno com base no conteúdo do curso (sumário + aula
   atual). Histórico vive no cliente; acesso validado no servidor. */

interface AiTutorProps {
  courseId: string
  courseTitle: string
  mentorName: string
  currentLessonId: string | null
  currentLessonTitle: string | null
  user: UserDTO | null
  onLogin: () => void
  /** Desloca o botão flutuante p/ cima (ex.: acima do "sair do modo foco") */
  raised?: boolean
}

const SUGGESTIONS = [
  'Resuma o que já vimos até agora',
  'Qual o ponto mais importante desta aula?',
  'Como posso praticar este conteúdo?',
  'Estou travado — por onde sigo?',
]

export function AiTutor(props: AiTutorProps) {
  const { courseId, courseTitle, mentorName, currentLessonId, currentLessonTitle, user, onLogin, raised } = props

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AiTutorChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    })
  }, [])

  useEffect(() => {
    scrollToEnd()
  }, [messages, sending, scrollToEnd])

  // Troca de curso/aula → conversa nova (contexto muda)
  useEffect(() => {
    setMessages([])
  }, [courseId])

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text || sending) return
      if (!user) {
        onLogin()
        return
      }
      if (text.length > 1000) {
        toast.error('Sua dúvida está muito longa (máx. 1000 caracteres).')
        return
      }

      const history = messages.slice(-10)
      setMessages((prev) => [...prev, { role: 'user', content: text }])
      setDraft('')
      setSending(true)
      try {
        const { reply } = await api.aiTutor({
          courseId,
          lessonId: currentLessonId ?? undefined,
          userId: user.id,
          message: text,
          history,
        })
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao consultar o Tutor IA.')
      } finally {
        setSending(false)
      }
    },
    [courseId, currentLessonId, messages, onLogin, sending, user]
  )

  return (
    <>
      {/* Botão flutuante (sempre acima da barra de ação fixa da sala; no modo
          foco, sobe mais p/ não cobrir o botão "sair do modo foco") */}
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir Tutor IA do curso"
        className={cn(
          'fixed right-6 z-40 h-12 rounded-full bg-blue-700 pl-4 pr-5 text-sm font-bold text-white shadow-2xl shadow-blue-900/30 ring-1 ring-blue-500/30 hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-blue-400',
          raised ? 'bottom-[8.5rem]' : 'bottom-[5.5rem]'
        )}
      >
        <Sparkles aria-hidden className="h-4 w-4" />
        Tutor IA
      </Button>

      {/* Painel do chat: drawer lateral (desktop) / folha quase cheia (mobile) */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="tutor-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.aside
              key="tutor-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Tutor IA do curso"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 right-0 top-0 z-[61] flex w-full flex-col bg-white shadow-2xl sm:bottom-3 sm:right-3 sm:top-3 sm:w-[420px] sm:rounded-2xl dark:bg-slate-900"
            >
              {/* Header */}
              <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm dark:bg-blue-600">
                    <Bot aria-hidden className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                      Tutor IA
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {currentLessonTitle ? `Aula atual: ${currentLessonTitle}` : courseTitle}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar Tutor IA"
                >
                  <X aria-hidden className="h-4 w-4" />
                </Button>
              </header>

              {/* Mensagens */}
              <div
                ref={listRef}
                className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
                aria-live="polite"
              >
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Oi! 👋 Sou o Tutor IA de <span className="text-blue-700 dark:text-blue-300">{courseTitle}</span>.
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      Tire dúvidas sobre o conteúdo das aulas — respondo com base no material do
                      curso. Para questões pessoais, o {mentorName} responde na aba Perguntas.
                    </p>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={
                        m.role === 'user'
                          ? 'max-w-[85%] rounded-2xl rounded-br-md bg-blue-700 px-3.5 py-2.5 text-sm leading-relaxed text-white dark:bg-blue-600'
                          : 'max-w-[90%] whitespace-pre-line rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'
                      }
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start" aria-busy="true">
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 dark:bg-blue-400"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sugestões (só quando a conversa está vazia) */}
                {messages.length === 0 && !sending && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        className="min-h-11 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-left text-xs font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 sm:min-h-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
                {user ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      void send(draft)
                    }}
                    className="flex items-end gap-2"
                  >
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void send(draft)
                        }
                      }}
                      placeholder="Escreva sua dúvida sobre o curso…"
                      aria-label="Sua dúvida para o Tutor IA"
                      rows={1}
                      className="max-h-32 min-h-11 resize-none rounded-xl text-sm"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={sending || draft.trim().length === 0}
                      aria-label="Enviar dúvida"
                      className="h-11 w-11 shrink-0 rounded-xl bg-blue-700 hover:bg-blue-800"
                    >
                      <Send aria-hidden className="h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <Button
                    className="h-11 w-full rounded-xl bg-blue-700 font-semibold hover:bg-blue-800"
                    onClick={onLogin}
                  >
                    <MessageCircleQuestion aria-hidden className="h-4 w-4" />
                    Entrar para conversar com o Tutor IA
                  </Button>
                )}
                <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <CornerDownLeft aria-hidden className="h-3 w-3" />
                  Enter envia · Shift+Enter quebra linha · a IA pode errar — confira no material
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
