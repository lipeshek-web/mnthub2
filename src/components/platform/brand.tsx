'use client'

import { Orbit } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Identidade da marca Órbita — um só lugar para nome, slogan e logo.
 * A marca em texto usa “Ó” acentuado; em contextos onde acento pode
 * quebrar (IDs/protocolos) use orbita (lowercase) — nunca aqui.
 */

export const BRAND_NAME = 'Órbita'
export const BRAND_TAGLINE = 'Seu universo de aprendizado'
export const BRAND_DESCRIPTION =
  'Mentorias 1:1, cursos, trilhas, biblioteca e eventos orbitando o seu crescimento — tudo em uma só plataforma.'

/** Símbolo da marca: quadrado azul com o planeta + anel orbital */
export function BrandMark({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-[0.9rem] bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm shadow-blue-600/25',
        'h-9 w-9',
        className
      )}
    >
      <Orbit className={cn('h-5 w-5', iconClassName)} strokeWidth={2.2} aria-hidden />
    </span>
  )
}

/** Logo completo: símbolo + wordmark (usado em navbar, footer e telas de entrada) */
export function BrandLogo({
  className,
  markClassName,
  textClassName,
  compact = false,
}: {
  className?: string
  markClassName?: string
  textClassName?: string
  compact?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandMark className={markClassName} />
      {!compact && (
        <span
          className={cn(
            'text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50',
            textClassName
          )}
        >
          Órbita
        </span>
      )}
    </span>
  )
}
