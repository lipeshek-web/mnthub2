/**
 * MentorHub service worker — PWA instalável.
 *
 * Estratégias:
 *  - ?cache=0 (dev): NÃO serve nada do cache — o app sempre vai à rede
 *    (chunks do Turbopack mudam a cada edição). O SW existe para instalabilidade.
 *  - ?cache=1 (prod):
 *      · Navegações (document): network-first com fallback ao cache (offline).
 *      · Estáticos imutáveis (/_next/static, /icons, imagens): cache-first.
 *      · Demais GET same-origin (API etc.): network-only.
 */
const VERSION = 'mentorhub-v1'
const CACHEABLE = ['/_next/static/', '/icons/', '/logo.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

/** Modo de cache lido da query do próprio script (?cache=1|0) */
function cacheEnabled() {
  try {
    const url = new URL(self.registration.active?.scriptURL || self.location.href)
    return url.searchParams.get('cache') === '1'
  } catch {
    return false
  }
}

function isCacheableAsset(url) {
  if (url.origin !== self.location.origin) return false
  return CACHEABLE.some((prefix) => url.pathname.startsWith(prefix))
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  // Dev: sempre rede (sem cache) — instalabilidade sem stale chunks
  if (!cacheEnabled()) return

  const url = new URL(req.url)

  // Navegações: network-first, cai para o cache em offline
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req)
          const cache = await caches.open(VERSION)
          cache.put('/', fresh.clone()).catch(() => {})
          return fresh
        } catch {
          const cache = await caches.open(VERSION)
          return (
            (await cache.match('/')) ||
            (await cache.match(req)) ||
            new Response('Offline', { status: 503, statusText: 'Offline' })
          )
        }
      })()
    )
    return
  }

  // Estáticos imutáveis: cache-first
  if (isCacheableAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(VERSION)
        const hit = await cache.match(req)
        if (hit) return hit
        try {
          const fresh = await fetch(req)
          if (fresh.ok) cache.put(req, fresh.clone()).catch(() => {})
          return fresh
        } catch {
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        }
      })()
    )
  }
})
