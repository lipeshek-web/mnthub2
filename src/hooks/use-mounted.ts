'use client'

import { useCallback, useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

/**
 * Detecta a montagem no cliente sem setState em effect (sem render cascata).
 * No servidor e no primeiro render de hidratação devolve false — então qualquer
 * leitura de estado persistido (zustand/localStorage) deve ser condicionada a
 * este flag para não divergir do HTML do servidor (hydration mismatch).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

/**
 * Lê um valor do store zustand de forma hidratação-segura: no servidor e no
 * primeiro render do cliente devolve o fallback (tipicamente null), depois
 * reflete o valor real (incluindo o rehidratado do localStorage).
 */
export function useHydrationSafe<T>(selector: () => T, fallback: T): T {
  const mounted = useMounted()
  const value = useSyncExternalStore(
    emptySubscribe,
    selector,
    () => fallback
  )
  return mounted ? value : fallback
}
