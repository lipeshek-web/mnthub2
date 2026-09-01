'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { usePrefersReducedMotion } from '@/hooks/use-in-view-once'
import type { PromoBarItemDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

// ==================== BARRA PROMOCIONAL (acima do header) ====================
// Estilo Apple: faixa escura fina com uma mensagem por vez, rotação suave,
// cupom copiável e botão de fechar (lembrado por sessão — volta se o conteúdo
// mudar). Sem conteúdo ativo, não renderiza nada.

const ROTATE_MS = 5200
const DISMISS_KEY = 'mh-promo-dismissed'

export function PromoBar() {
  const [items, setItems] = useState<PromoBarItemDTO[] | null>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [copied, setCopied] = useState(false)
  // localStorage lido no inicializador lazy: PromoBar renderiza null enquanto
  // `items` é null (SSR e primeira renderização), então não há mismatch.
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(DISMISS_KEY)
    } catch {
      return null
    }
  })
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    let active = true
    api
      .promoBar()
      .then(({ items }) => {
        if (active) setItems(items)
      })
      .catch(() => {
        if (active) setItems([])
      })
    return () => {
      active = false
    }
  }, [])

  /** Assinatura do conteúdo atual: fechar de novo quando os cupons mudarem */
  const signature = useMemo(() => (items ?? []).map((i) => i.id).join(','), [items])

  const visible = Boolean(items && items.length > 0 && dismissed !== signature)
  const current = visible && items ? items[index % items.length] : null

  // Rotação automática — pausa no hover/foco e respeita prefers-reduced-motion
  useEffect(() => {
    if (!visible || paused || reducedMotion || !items || items.length < 2) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS)
    return () => window.clearInterval(id)
  }, [visible, paused, reducedMotion, items])

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, signature)
    } catch {
      /* ignore */
    }
    setDismissed(signature)
  }

  const copyCode = async () => {
    if (!current) return
    try {
      await navigator.clipboard.writeText(current.code)
      setCopied(true)
      toast.success(`Cupom ${current.code} copiado!`)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Não foi possível copiar o código.')
    }
  }

  if (!visible || !current) return null

  return (
    <div
      role="region"
      aria-label="Promoções e cupons"
      className="relative shrink-0 bg-stone-950 text-white dark:bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-center px-10 sm:px-12">
        {/* key={current.id} + animação CSS: troca de mensagem sem lib de animação */}
        <p
          key={current.id}
          className="mh-slide-in flex min-w-0 items-center justify-center gap-2 text-xs leading-none sm:text-sm"
        >
            <span className="truncate font-medium">{current.message}</span>
            <span className="hidden shrink-0 text-white/50 sm:inline">·</span>
            <span className="hidden shrink-0 text-white/60 md:inline">{current.scopeLabel}</span>
            <button
              type="button"
              onClick={() => void copyCode()}
              aria-label={`Copiar cupom ${current.code}`}
              className={cn(
                'inline-flex min-h-7 shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                copied && 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'
              )}
            >
              {copied ? <Check aria-hidden className="h-3 w-3" /> : <Copy aria-hidden className="h-3 w-3" />}
              {current.code}
            </button>
        </p>

        {/* Indicadores discretos quando há mais de uma promoção */}
        {items && items.length > 1 && (
          <div className="absolute left-4 hidden items-center gap-1 sm:flex" aria-hidden>
            {items.map((it, i) => (
              <button
                key={it.id}
                type="button"
                tabIndex={-1}
                onClick={() => setIndex(i)}
                aria-hidden
                className={cn(
                  'h-1 rounded-full transition-all',
                  i === index % items.length ? 'w-4 bg-white/80' : 'w-1.5 bg-white/25'
                )}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar barra de promoções"
          className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:right-3"
        >
          <X aria-hidden className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
