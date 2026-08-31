'use client'

import { useEffect } from 'react'

/**
 * Registra o service worker do PWA (manifest + installability + cache básico).
 * Em dev, o SW é registrado com ?cache=0 e NÃO serve nada do cache (HTML e
 * chunks do Turbopack mudam a cada edição) — só fica instalável. Em produção
 * (?cache=1) usa cache-first para estáticos e network-first para navegação.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return

    const isProd = process.env.NODE_ENV === 'production'
    const url = `/sw.js?cache=${isProd ? '1' : '0'}`
    navigator.serviceWorker.register(url, { scope: '/' }).catch(() => {
      // Falha silenciosa: PWA é progressivo, o app funciona sem ele
    })
  }, [])

  return null
}
