'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

/**
 * useInViewOnce — substituto enxuto do useInView do framer-motion.
 * Marca true quando o elemento se aproxima da viewport (uma única vez) e
 * desconecta o observador. Zero dependências: IntersectionObserver nativo.
 *
 * Uso típico: fetch preguiçoso quando uma seção abaixo da dobra se aproxima.
 */
export function useInViewOnce<T extends HTMLElement = HTMLElement>(margin = '600px') {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (inView) return
    const el = ref.current
    // Sem elemento ou sem suporte a IO (navegador antigo): dispara direto
    // (via microtask, para não fazer setState síncrono no corpo do efeito)
    if (!el || typeof IntersectionObserver === 'undefined') {
      const id = window.setTimeout(() => setInView(true), 0)
      return () => window.clearTimeout(id)
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: margin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, margin])

  return { ref, inView }
}

// Singleton da media query (evita recriar a cada render/chamada)
let reducedMotionQuery: MediaQueryList | null = null
function getReducedMotionQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  reducedMotionQuery ??= window.matchMedia('(prefers-reduced-motion: reduce)')
  return reducedMotionQuery
}

/** Respeita prefers-reduced-motion sem framer-motion (matchMedia + useSyncExternalStore). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = getReducedMotionQuery()
      if (!mq) return () => {}
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => getReducedMotionQuery()?.matches ?? false,
    () => false
  )
}
