'use client'

import {
  ArrowUpRight,
  Bookmark,
  Camera,
  ExternalLink,
  Github,
  Globe2,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  PlayCircle,
} from 'lucide-react'

import { Avatar } from '@/components/platform/avatar'
import { avatarGradient, firstName, socialDisplay, socialUrl } from '@/lib/helpers'
import type { SocialLinksDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

// Gradiente oficial do Instagram (anéis de story)
const INSTAGRAM_RING = 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)'

/** Ícones decorativos dos "posts" do grid do Instagram (um por tile, na ordem) */
const INSTAGRAM_TILE_ICONS = [Heart, MessageCircle, PlayCircle, Camera, ImageIcon, Bookmark]

/** Hash determinístico simples para decidir o preenchimento de células */
function hashString(value: string): number {
  return [...value].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
}

/** Classes base de um cartão-âncora (claro) com foco visível em esmeralda */
const CARD_BASE =
  'group flex flex-col rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600'

/** Rodapé padrão dos cartões claros: ação + seta */
function CardFooter({ label, dark = false }: { label: string; dark?: boolean }) {
  return (
    <div
      className={cn(
        'mt-3 flex items-center justify-between border-t pt-2.5',
        dark ? 'border-white/10' : 'border-stone-100'
      )}
    >
      <span
        className={cn(
          'text-[11px] font-bold',
          dark ? 'text-white/70' : 'text-stone-600 group-hover:text-amber-700'
        )}
      >
        {label}
      </span>
      <ArrowUpRight
        className={cn(
          'size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5',
          dark ? 'text-white/50' : 'text-stone-400'
        )}
        aria-hidden
      />
    </div>
  )
}

// ---------- Cartão do Instagram ----------

function InstagramCard({ handle, mentorName }: { handle: string; mentorName: string }) {
  return (
    <a
      href={socialUrl('instagram', handle)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Instagram de ${mentorName} — @${handle.replace(/^@/, '')} (abre em nova aba)`}
      className={cn(CARD_BASE, 'w-full sm:w-72')}
    >
      <div className="flex items-center gap-2.5">
        <div
          aria-hidden
          className="shrink-0 rounded-full p-[2.5px]"
          style={{ backgroundImage: INSTAGRAM_RING }}
        >
          <Avatar name={mentorName} size="sm" className="ring-1 ring-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-stone-900">@{handle.replace(/^@/, '')}</p>
          <p className="text-[11px] font-medium text-stone-400">Instagram</p>
        </div>
        <ExternalLink className="size-3.5 shrink-0 text-stone-300" aria-hidden />
      </div>

      {/* Grid de "posts" simulando o perfil */}
      <div aria-hidden className="mt-3 grid grid-cols-3 gap-1">
        {INSTAGRAM_TILE_ICONS.map((Icon, i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-lg"
            style={avatarGradient(`${handle}${i}`)}
          >
            <Icon className="h-5 w-5 text-white/20" />
          </div>
        ))}
      </div>

      <CardFooter label="Ver perfil completo" />
    </a>
  )
}

// ---------- Cartão do LinkedIn ----------

function LinkedInCard({ value, mentorName }: { value: string; mentorName: string }) {
  return (
    <a
      href={socialUrl('linkedin', value)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`LinkedIn de ${mentorName} — ${socialDisplay('linkedin', value)} (abre em nova aba)`}
      className={cn(CARD_BASE, 'w-full sm:w-64')}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0A66C2] pb-0.5 text-xl font-black leading-none text-white"
        >
          in
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-stone-900">{socialDisplay('linkedin', value)}</p>
          <p className="text-[11px] font-medium text-stone-400">LinkedIn</p>
        </div>
      </div>
      <CardFooter label="Abrir perfil" />
    </a>
  )
}

// ---------- Cartão do GitHub ----------

function GitHubCard({ handle, mentorName }: { handle: string; mentorName: string }) {
  const clean = handle.replace(/^@/, '')
  return (
    <a
      href={socialUrl('github', handle)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`GitHub de ${mentorName} — @${clean} (abre em nova aba)`}
      className="group flex w-full flex-col rounded-2xl border border-stone-800 bg-stone-900 p-4 text-left shadow-sm transition-colors hover:border-amber-400/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 sm:w-72"
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"
        >
          <Github className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">@{clean}</p>
          <p className="text-[11px] font-medium text-white/50">GitHub</p>
        </div>
        <ExternalLink className="size-3.5 shrink-0 text-white/30" aria-hidden />
      </div>

      {/* Grafo de contribuições simulado (determinístico) */}
      <div aria-hidden className="mt-3 grid grid-cols-7 gap-[2px]">
        {Array.from({ length: 35 }, (_, i) => {
          const row = Math.floor(i / 7)
          const col = i % 7
          const seed = `${clean}${row}${col}`
          const h = hashString(seed)
          const filled = h % 10 < 4 // ~40% das células
          return (
            <div
              key={i}
              className={cn('h-2.5 w-2.5 rounded-[2px]', !filled && 'bg-white/10')}
              style={
                filled
                  ? { ...avatarGradient(seed), opacity: 0.55 + (h % 3) * 0.2 }
                  : undefined
              }
            />
          )
        })}
      </div>

      <CardFooter label="Ver repositórios" dark />
    </a>
  )
}

// ---------- Cartão do Site / Portfólio ----------

function WebsiteCard({ value, mentorName }: { value: string; mentorName: string }) {
  return (
    <a
      href={socialUrl('website', value)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Site ou portfólio de ${mentorName} — ${socialDisplay('website', value)} (abre em nova aba)`}
      className={cn(CARD_BASE, 'w-full sm:w-64')}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100"
        >
          <Globe2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-stone-900">{socialDisplay('website', value)}</p>
          <p className="text-[11px] font-medium text-stone-400">Portfólio / Site</p>
        </div>
      </div>
      <CardFooter label="Abrir" />
    </a>
  )
}

// ---------- Seção principal ----------

/**
 * Cartões de prévia das redes sociais do mentor.
 * Renderiza NOTHING quando nenhuma rede está cadastrada.
 */
export function SocialLinksSection({
  socials,
  mentorName,
  headline,
}: {
  socials: SocialLinksDTO
  mentorName: string
  headline: string
}) {
  const instagram = socials.instagram?.trim() || ''
  const linkedin = socials.linkedin?.trim() || ''
  const github = socials.github?.trim() || ''
  const website = socials.website?.trim() || ''

  if (!instagram && !linkedin && !github && !website) return null

  return (
    <section aria-label={`Redes sociais e portfólio de ${mentorName}`} className="mt-4">
      <p className="sr-only">
        Onde encontrar {mentorName} na internet — {headline}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
        Encontre {firstName(mentorName)} também em
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        {instagram && <InstagramCard handle={instagram} mentorName={mentorName} />}
        {linkedin && <LinkedInCard value={linkedin} mentorName={mentorName} />}
        {github && <GitHubCard handle={github} mentorName={mentorName} />}
        {website && <WebsiteCard value={website} mentorName={mentorName} />}
      </div>
    </section>
  )
}
