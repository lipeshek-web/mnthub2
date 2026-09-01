'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type RevealTag = 'div' | 'section' | 'li' | 'ul'

/**
 * Reveal — substituto enxuto das animações whileInView do framer-motion.
 *
 * Estratégia progressiva (amigável ao PageSpeed):
 * - O conteúdo nasce VISÍVEL no HTML do servidor (nada de opacity:0 no SSR):
 *   LCP e CLS não são penalizados, e sem JS a página continua legível.
 * - No cliente, se o elemento estiver abaixo da dobra, esconde via classe CSS
 *   e anima ao se aproximar da viewport (IntersectionObserver nativo).
 * - Elementos acima da dobra nunca são escondidos (sem atraso de entrada).
 * - Zero re-render do React: as classes são aplicadas direto no DOM.
 * - prefers-reduced-motion: CSS desativa tudo automaticamente.
 */
export function Reveal({
  children,
  className,
  tag: Tag = 'div',
  delay = 0,
  ...rest
}: {
  children: ReactNode
  className?: string
  tag?: RevealTag
  /** Atraso da transição em ms (stagger) — só se aplica quando anima */
  delay?: number
} & Omit<React.HTMLAttributes<HTMLElement>, 'children'>) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Sem IntersectionObserver (navegador antigo): conteúdo permanece visível
    if (typeof IntersectionObserver === 'undefined') return

    // Já visível na carga (above the fold)? Não anima — conteúdo imediato.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) return

    // Abaixo da dobra: esconde agora e revela quando se aproximar da viewport.
    // Manipulação de classes fora do React — sem setState, sem re-render.
    el.classList.add('mh-reveal-hidden')
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          if (delay > 0) el.style.transitionDelay = `${delay}ms`
          el.classList.remove('mh-reveal-hidden')
          el.classList.add('mh-reveal-in')
          io.disconnect()
        }
      },
      // Dispara um pouco antes de entrar na viewport (mesmo feel do whileInView -80px)
      { rootMargin: '0px 0px -80px 0px' }
    )
    io.observe(el)

    return () => {
      io.disconnect()
      el.classList.remove('mh-reveal-hidden', 'mh-reveal-in')
      el.style.transitionDelay = ''
    }
  }, [delay])

  return (
    <Tag ref={ref as never} className={className} {...rest}>
      {children}
    </Tag>
  )
}
