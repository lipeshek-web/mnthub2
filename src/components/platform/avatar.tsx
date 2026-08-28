'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { avatarGradient, initials } from '@/lib/helpers'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
} as const

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string
  /** URL de foto (opcional) — cai para as iniciais se ausente/quebrada */
  src?: string | null
  size?: keyof typeof SIZES
  className?: string
}) {
  const [broken, setBroken] = useState(false)
  const showPhoto = Boolean(src) && !broken

  return (
    <div
      aria-hidden={false}
      aria-label={`Avatar de ${name}`}
      title={name}
      className={cn(
        'relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-bold tracking-wide text-white shadow-sm ring-2 ring-white',
        SIZES[size],
        className
      )}
      style={showPhoto ? undefined : avatarGradient(name)}
    >
      {showPhoto ? (
        <img
          src={src as string}
          alt={`Foto de ${name}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        initials(name)
      )}
    </div>
  )
}

export function Stars({
  rating,
  size = 14,
  className,
}: {
  rating: number
  size?: number
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'
          }
        />
      ))}
    </span>
  )
}
