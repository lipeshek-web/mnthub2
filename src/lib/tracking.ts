'use client'

// ============================================================
// Rastreamento (Google Analytics 4 + Meta Pixel) e atribuição
// de tráfego para campanhas pagas dos mentores.
//
// Fluxo:
//  1. captureAttributionFromUrl() — na carga da página, captura
//     utm_source/medium/campaign/content/term + gclid/fbclid,
//     classifica o canal e persiste (janela de 7 dias).
//  2. loadTrackingScripts() — injeta gtag.js (GA4) e fbevents.js
//     (Meta Pixel) da plataforma (env) e/ou do mentor (LP/cursos).
//  3. trackEvent() — registra o evento no banco (/api/track,
//     fonte da verdade para o painel do mentor) e repassa aos
//     pixels carregados (GA4 e Meta com nomes padrão de e-commerce).
// ============================================================

import type { AttributionDTO } from './types'

const ATTR_KEY = 'mh_attribution_v1'
const ATTR_TTL_MS = 7 * 24 * 60 * 60 * 1000 // janela de atribuição: 7 dias

export type TrackEventName = 'page_view' | 'view_item' | 'begin_checkout' | 'purchase' | 'lead'

export interface TrackEventProps {
  mentorId?: string | null
  courseId?: string | null
  /** Valor em reais (conversões: purchase) */
  value?: number
  transactionId?: string
  contentName?: string
  /** Se informado, sobrescreve a landing armazenada (mentor_lp | platform) */
  landingPage?: 'mentor_lp' | 'platform'
}

interface StoredAttribution {
  first: AttributionDTO
  last: AttributionDTO
  updatedAt: number
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string }
  }
}

const SOCIAL_SOURCES = ['instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'x', 'youtube', 'whatsapp', 'meta', 'threads']
const PAID_MEDIUMS = ['cpc', 'ppc', 'cpp', 'cpm', 'cpv', 'paid', 'ads', 'ad', 'banner', 'display', 'paidsearch', 'paid_search']

/** Classifica o canal de aquisição a partir dos parâmetros de campanha */
export function classifyChannel(input: {
  utmSource?: string | null
  utmMedium?: string | null
  gclid?: string | null
  fbclid?: string | null
  referrer?: string | null
}): string {
  const source = (input.utmSource || '').toLowerCase()
  const medium = (input.utmMedium || '').toLowerCase()

  if (input.gclid) return 'paid_search'
  if (input.fbclid) return 'paid_social'
  if (PAID_MEDIUMS.includes(medium)) {
    return SOCIAL_SOURCES.includes(source) ? 'paid_social' : 'paid_search'
  }
  if (SOCIAL_SOURCES.includes(source)) return 'social'
  if (medium === 'email' || medium === 'newsletter') return 'email'
  if (source || medium) return 'referral'
  if (typeof document !== 'undefined' && input.referrer) {
    try {
      const refHost = new URL(input.referrer).hostname
      if (refHost && refHost !== window.location.hostname) return 'referral'
    } catch {
      /* referrer inválido */
    }
  }
  return 'direct'
}

/** Lê a atribuição persistida (ou null se inexistente/expirada) */
export function getAttribution(): AttributionDTO | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(ATTR_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAttribution
    if (!parsed?.last || Date.now() - parsed.updatedAt > ATTR_TTL_MS) {
      window.localStorage.removeItem(ATTR_KEY)
      return null
    }
    return parsed.last
  } catch {
    return null
  }
}

function persistAttribution(attr: AttributionDTO) {
  try {
    const raw = window.localStorage.getItem(ATTR_KEY)
    const previous = raw ? (JSON.parse(raw) as StoredAttribution) : null
    const stored: StoredAttribution = {
      first: previous?.first ?? attr,
      last: attr,
      updatedAt: Date.now(),
    }
    window.localStorage.setItem(ATTR_KEY, JSON.stringify(stored))
  } catch {
    /* storage indisponível */
  }
}

/** Atualiza apenas a landing page armazenada (ex.: entrada direta na LP do mentor) */
export function setAttributionLandingPage(landingPage: 'mentor_lp' | 'platform') {
  const current = getAttribution()
  const fresh: AttributionDTO = {
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    gclid: null,
    fbclid: null,
    channel: 'direct',
    landingPage,
  }
  if (!current) {
    persistAttribution(fresh)
    return
  }
  persistAttribution({ ...current, landingPage })
}

/**
 * Captura utm_*, gclid, fbclid da URL corrente (last non-direct click) e
 * persiste com janela de 7 dias. Retorna a atribuição ativa após a captura.
 * `mentorSlugParam`: presente quando a URL é uma LP de mentor (?mentor=slug).
 */
export function captureAttributionFromUrl(mentorSlugParam?: string | null): AttributionDTO | null {
  if (typeof window === 'undefined') return null
  const sp = new URLSearchParams(window.location.search)
  const g = (k: string) => sp.get(k)?.trim() || null

  const utmSource = g('utm_source')
  const utmMedium = g('utm_medium')
  const utmCampaign = g('utm_campaign')
  const utmContent = g('utm_content')
  const utmTerm = g('utm_term')
  const gclid = g('gclid')
  const fbclid = g('fbclid')

  const hasCampaignParams = Boolean(
    utmSource || utmMedium || utmCampaign || utmContent || utmTerm || gclid || fbclid
  )
  const landingPage: 'mentor_lp' | 'platform' = mentorSlugParam ? 'mentor_lp' : 'platform'

  if (hasCampaignParams) {
    // Último clique não-direto vence: sobrescreve a atribuição anterior
    const attr: AttributionDTO = {
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      gclid,
      fbclid,
      channel: classifyChannel({ utmSource, utmMedium, gclid, fbclid, referrer: document.referrer || null }),
      landingPage,
    }
    persistAttribution(attr)
    return attr
  }

  // Sem parâmetros de campanha: preserva a janela existente e só marca a landing
  const current = getAttribution()
  if (current) {
    persistAttribution({ ...current, landingPage })
    return { ...current, landingPage }
  }
  const fresh: AttributionDTO = {
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    gclid: null,
    fbclid: null,
    channel: 'direct',
    landingPage,
  }
  persistAttribution(fresh)
  return fresh
}

/** Remove utm_*, gclid, fbclid da URL (preserva mentor/course), evitando recontagem em refresh */
export function cleanUrlParams() {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    const keep = new URLSearchParams()
    url.searchParams.forEach((v, k) => {
      if (k === 'mentor' || k === 'course' || k === 'reset' || k === 'booking') keep.set(k, v)
    })
    const qs = keep.toString()
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
  } catch {
    /* ignore */
  }
}

// ---------- Injeção de scripts de rastreamento ----------

const gaLoaded = new Set<string>()
const pixelLoaded = new Set<string>()

function loadGoogleAnalytics(id: string) {
  if (!id || gaLoaded.has(id) || typeof document === 'undefined') return
  gaLoaded.add(id)
  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function (...args: unknown[]) {
      window.dataLayer!.push(args)
    }
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(s)
  window.gtag('js', new Date())
  // page_view é disparado manualmente pelo trackEvent
  window.gtag('config', id, { send_page_view: false })
}

function loadMetaPixel(id: string) {
  if (!id || pixelLoaded.has(id) || typeof document === 'undefined') return
  pixelLoaded.add(id)
  if (!window.fbq) {
    const n: NonNullable<Window['fbq']> = function (...args: unknown[]) {
      if (n.callMethod) {
        n.callMethod(...args)
      } else {
        n.queue!.push(args)
      }
    } as NonNullable<Window['fbq']>
    n.queue = []
    n.loaded = true
    n.version = '2.0'
    window.fbq = n
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
  }
  window.fbq!('init', id)
}

/** IDs da plataforma (definidos via env no build/deploy) */
export function platformTrackingIds(): { gaId: string | null; pixelId: string | null } {
  return {
    gaId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null,
    pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || null,
  }
}

/** Injeta GA4 + Meta Pixel da plataforma e/ou do mentor (IDs são públicos) */
export function loadTrackingScripts(opts?: {
  mentorGaId?: string | null
  mentorPixelId?: string | null
}) {
  if (typeof window === 'undefined') return
  const platform = platformTrackingIds()
  if (platform.gaId) loadGoogleAnalytics(platform.gaId)
  if (platform.pixelId) loadMetaPixel(platform.pixelId)
  if (opts?.mentorGaId) loadGoogleAnalytics(opts.mentorGaId)
  if (opts?.mentorPixelId) loadMetaPixel(opts.mentorPixelId)
}

// ---------- Envio de eventos ----------

const GA_EVENT_MAP: Record<TrackEventName, string> = {
  page_view: 'page_view',
  view_item: 'view_item',
  begin_checkout: 'begin_checkout',
  purchase: 'purchase',
  lead: 'generate_lead',
}

const META_EVENT_MAP: Record<TrackEventName, string> = {
  page_view: 'PageView',
  view_item: 'ViewContent',
  begin_checkout: 'InitiateCheckout',
  purchase: 'Purchase',
  lead: 'Lead',
}

/**
 * Registra um evento de conversão:
 *  → POST /api/track (banco = fonte da verdade do painel do mentor)
 *  → GA4 + Meta Pixel (se carregados), com parâmetros padrão de e-commerce.
 */
export function trackEvent(name: TrackEventName, props: TrackEventProps = {}) {
  if (typeof window === 'undefined') return
  const attribution = getAttribution()
  const path = `${window.location.pathname}${window.location.search}`

  // 1) Servidor (painel do mentor)
  const body = JSON.stringify({
    name,
    mentorId: props.mentorId ?? null,
    courseId: props.courseId ?? null,
    value: props.value ?? null,
    path,
    attribution,
  })
  try {
    navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
  } catch {
    fetch('/api/track', { method: 'POST', body, keepalive: true }).catch(() => {})
  }

  // 2) GA4
  try {
    window.gtag?.('event', GA_EVENT_MAP[name], {
      page_path: name === 'page_view' ? path : undefined,
      value: props.value,
      currency: props.value != null ? 'BRL' : undefined,
      transaction_id: props.transactionId,
      items:
        props.contentName && name !== 'page_view'
          ? [{ item_name: props.contentName, item_id: props.courseId ?? undefined }]
          : undefined,
    })
  } catch {
    /* GA indisponível */
  }

  // 3) Meta Pixel
  try {
    window.fbq?.('track', META_EVENT_MAP[name], {
      content_name: props.contentName,
      content_ids: props.courseId ? [props.courseId] : undefined,
      content_type: props.courseId ? 'product' : undefined,
      value: props.value,
      currency: props.value != null ? 'BRL' : undefined,
    })
  } catch {
    /* Pixel indisponível */
  }
}

/** Monta a URL pública rastreável da LP do mentor (usada no gerador de links) */
export function buildMentorLpUrl(
  slug: string,
  utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string }
): string {
  if (typeof window === 'undefined') return `/?mentor=${slug}`
  const sp = new URLSearchParams({ mentor: slug })
  if (utm?.source) sp.set('utm_source', utm.source)
  if (utm?.medium) sp.set('utm_medium', utm.medium)
  if (utm?.campaign) sp.set('utm_campaign', utm.campaign)
  if (utm?.content) sp.set('utm_content', utm.content)
  if (utm?.term) sp.set('utm_term', utm.term)
  return `${window.location.origin}/?${sp.toString()}`
}

/** Monta a URL pública rastreável de um curso específico */
export function buildCourseUrl(courseId: string, utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string }): string {
  if (typeof window === 'undefined') return `/?course=${courseId}`
  const sp = new URLSearchParams({ course: courseId })
  if (utm?.source) sp.set('utm_source', utm.source)
  if (utm?.medium) sp.set('utm_medium', utm.medium)
  if (utm?.campaign) sp.set('utm_campaign', utm.campaign)
  if (utm?.content) sp.set('utm_content', utm.content)
  if (utm?.term) sp.set('utm_term', utm.term)
  return `${window.location.origin}/?${sp.toString()}`
}
