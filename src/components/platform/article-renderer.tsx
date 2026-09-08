'use client'

/**
 * Leitor rico de artigos em blocos — contraparte de leitura do
 * article-editor. Recebe o doc parseado (src/lib/article-blocks) e renderiza
 * cada bloco com a identidade Órbita (azul + slate): player de áudio próprio,
 * vídeo (YouTube/Vimeo/MP4), imagens com legenda, botões CTA, citações,
 * destaques, listas e formatação inline (negrito/itálico/sublinhado/riscado/
 * link) sanitizada.
 *
 * `sizeClass` propaga o controle A−/A+ do leitor para o corpo do texto.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Info, Lightbulb, Pause, Play } from 'lucide-react'
import type { ArticleBlock, ArticleDoc } from '@/lib/article-blocks'
import { sanitizeInlineHtml } from '@/lib/inline-sanitize'
import { cn } from '@/lib/utils'

/** HTML inline pronto p/ render: sanitiza + abre links externos em nova aba */
function inlineHtml(html: string | undefined): string {
  if (!html) return ''
  const clean = sanitizeInlineHtml(html)
  if (!clean || typeof DOMParser === 'undefined') return clean
  const doc = new DOMParser().parseFromString(clean, 'text/html')
  for (const a of Array.from(doc.body.querySelectorAll('a[href]'))) {
    const href = a.getAttribute('href') ?? ''
    if (/^https?:/i.test(href)) {
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
    }
  }
  return doc.body.innerHTML
}

export function youtubeIdFromUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{6,20})/i,
    /(?:youtu\.be\/)([\w-]{6,20})/i,
    /(?:youtube\.com\/shorts\/)([\w-]{6,20})/i,
    /(?:youtube\.com\/embed\/)([\w-]{6,20})/i,
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

function vimeoIdFromUrl(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/i)
  return m?.[1] ?? null
}

/* ------------------------------- Áudio ---------------------------------- */

function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function AudioPlayer({
  src,
  title,
  compact = false,
}: {
  src: string
  title?: string
  compact?: boolean
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [])

  const seekTo = useCallback((clientX: number) => {
    const audio = audioRef.current
    const track = trackRef.current
    if (!audio || !track || !Number.isFinite(audio.duration) || audio.duration <= 0) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    audio.currentTime = ratio * audio.duration
    setCurrent(audio.currentTime)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => setCurrent(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || 0)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
    }
  }, [src])

  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
        compact ? 'p-3' : 'p-3.5 sm:p-4'
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pausar áudio' : 'Tocar áudio'}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95"
      >
        {playing ? <Pause className="size-4.5" aria-hidden /> : <Play className="ml-0.5 size-4.5" aria-hidden />}
      </button>
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="mb-1.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</p>
        ) : null}
        <div
          ref={trackRef}
          role="slider"
          aria-label="Progresso do áudio"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          tabIndex={0}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            seekTo(e.clientX)
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) seekTo(e.clientX)
          }}
          className="group relative h-2 cursor-pointer touch-none rounded-full bg-slate-200/80 dark:bg-slate-700/60"
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-blue-600"
            style={{ width: `${pct}%` }}
          />
          <div
            className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 opacity-0 shadow transition-opacity group-hover:opacity-100"
            style={{ left: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] font-medium tabular-nums text-slate-400 dark:text-slate-500">
          {fmtTime(current)} · {fmtTime(duration)}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------- Vídeo ---------------------------------- */

export function VideoEmbed({ src, cap }: { src: string; cap?: string }) {
  const yt = youtubeIdFromUrl(src)
  const vimeo = vimeoIdFromUrl(src)

  let player: React.ReactNode
  if (yt) {
    player = (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0`}
        title={cap || 'Vídeo incorporado'}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    )
  } else if (vimeo) {
    player = (
      <iframe
        src={`https://player.vimeo.com/video/${vimeo}`}
        title={cap || 'Vídeo incorporado'}
        loading="lazy"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    )
  } else {
    player = (
      <video
        src={src}
        controls
        preload="metadata"
        className="absolute inset-0 h-full w-full bg-black"
      />
    )
  }

  return (
    <figure className="my-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm dark:border-slate-800">
        {player}
      </div>
      {cap ? (
        <figcaption className="mt-2 text-center text-xs italic text-slate-500 dark:text-slate-400">{cap}</figcaption>
      ) : null}
    </figure>
  )
}

/* ------------------------------ Destaques ------------------------------- */

const CALLOUT_META = {
  info: {
    icon: Info,
    box: 'border-blue-500/70 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-950/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  tip: {
    icon: Lightbulb,
    box: 'border-amber-500/70 bg-amber-50/70 dark:border-amber-400 dark:bg-amber-950/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  warn: {
    icon: AlertTriangle,
    box: 'border-rose-500/70 bg-rose-50/70 dark:border-rose-400 dark:bg-rose-950/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
} as const

/* --------------------------- Blocos do artigo --------------------------- */

function BlockRenderer({ block, sizeClass }: { block: ArticleBlock; sizeClass?: string }) {
  switch (block.t) {
    case 'p': {
      if (!block.x) return <div aria-hidden className="h-2" />
      return (
        <p
          className={cn('whitespace-pre-line py-1.5 leading-relaxed text-slate-700 dark:text-slate-200', sizeClass)}
          dangerouslySetInnerHTML={{ __html: inlineHtml(block.x) }}
        />
      )
    }
    case 'h1':
      return (
        <h2
          className="mt-7 whitespace-pre-line text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50"
          dangerouslySetInnerHTML={{ __html: inlineHtml(block.x) }}
        />
      )
    case 'h2':
      return (
        <h2
          className="mt-7 whitespace-pre-line text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          dangerouslySetInnerHTML={{ __html: inlineHtml(block.x) }}
        />
      )
    case 'h3':
      return (
        <h3
          className="mt-6 whitespace-pre-line text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50"
          dangerouslySetInnerHTML={{ __html: inlineHtml(block.x) }}
        />
      )
    case 'img':
      return (
        <figure className="my-3">
          { }
          <img
            src={block.src}
            alt={block.alt || block.cap || ''}
            loading="lazy"
            className="w-full rounded-2xl border border-slate-200 bg-slate-100 object-cover shadow-sm dark:border-slate-800 dark:bg-slate-800"
          />
          {block.cap ? (
            <figcaption className="mt-2 text-center text-xs italic text-slate-500 dark:text-slate-400">
              {block.cap}
            </figcaption>
          ) : null}
        </figure>
      )
    case 'aud':
      return (
        <div className="my-3">
          <AudioPlayer src={block.src ?? ''} title={block.title} />
        </div>
      )
    case 'vid':
      return <VideoEmbed src={block.src ?? ''} cap={block.cap} />
    case 'btn': {
      const external = /^https?:/i.test(block.href ?? '')
      return (
        <div className="my-4 flex justify-center">
          <a
            href={block.href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all active:scale-[0.98]',
              block.variant === 'outline'
                ? 'border border-blue-600 bg-transparent text-blue-700 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-950/40'
                : 'bg-blue-600 text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 hover:shadow-lg'
            )}
          >
            {block.label}
          </a>
        </div>
      )
    }
    case 'quote':
      return (
        <blockquote className="my-4 border-l-4 border-blue-500 pl-4 sm:pl-5">
          <p
            className={cn('whitespace-pre-line font-medium italic leading-relaxed text-slate-800 dark:text-slate-100', sizeClass)}
            dangerouslySetInnerHTML={{ __html: inlineHtml(block.x) }}
          />
          {block.by ? (
            <footer className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">— {block.by}</footer>
          ) : null}
        </blockquote>
      )
    case 'ul':
      return (
        <ul className="space-y-2 py-2">
          {(block.items ?? []).map((item, i) => (
            <li key={i} className={cn('flex items-start gap-2.5 leading-relaxed text-slate-700 dark:text-slate-200', sizeClass)}>
              <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              <span dangerouslySetInnerHTML={{ __html: inlineHtml(item) }} />
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="space-y-2.5 py-2">
          {(block.items ?? []).map((item, i) => (
            <li key={i} className={cn('flex items-start gap-2.5 leading-relaxed text-slate-700 dark:text-slate-200', sizeClass)}>
              <span
                aria-hidden
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              >
                {i + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: inlineHtml(item) }} />
            </li>
          ))}
        </ol>
      )
    case 'callout': {
      const meta = CALLOUT_META[block.tone ?? 'info']
      const Icon = meta.icon
      return (
        <div className={cn('my-4 flex items-start gap-3 rounded-2xl border-l-4 p-4', meta.box)}>
          <Icon aria-hidden className={cn('mt-0.5 size-5 shrink-0', meta.iconColor)} />
          <div
            className={cn('whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-200', sizeClass)}
            dangerouslySetInnerHTML={{ __html: inlineHtml(block.x) }}
          />
        </div>
      )
    }
    case 'hr':
      return <hr aria-hidden className="my-7 border-slate-200 dark:border-slate-800" />
    default:
      return null
  }
}

export function ArticleBlocksRich({
  doc,
  sizeClass,
}: {
  doc: ArticleDoc
  sizeClass?: string
}) {
  return (
    <div className="space-y-1.5">
      {doc.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} sizeClass={sizeClass} />
      ))}
    </div>
  )
}
