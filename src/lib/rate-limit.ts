/**
 * Rate limiting simples em memória (janela deslizante por chave).
 *
 * Suficiente para o tráfego desta implantação (processo único) e sem novas
 * dependências. Protege os endpoints sensíveis: login, registro, verificação
 * MFA, checkout, IA e rastreamento.
 */

interface Bucket {
  hits: number[]
}

const buckets = new Map<string, Bucket>()

// Limpeza periódica para o Map não crescer sem limite
let lastSweep = Date.now()
function sweep(now: number, windowMs: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs)
    if (bucket.hits.length === 0) buckets.delete(key)
  }
}

export interface RateLimitResult {
  ok: boolean
  retryAfterSec: number
}

/**
 * Consome 1 hit da chave. `limit` eventos por `windowMs` milissegundos.
 * @param key identificador (ex.: `login:1.2.3.4`)
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now, windowMs)
  const bucket = buckets.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs)
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket)
    const oldest = bucket.hits[0] ?? now
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)) }
  }
  bucket.hits.push(now)
  buckets.set(key, bucket)
  return { ok: true, retryAfterSec: 0 }
}

/** IP do cliente considerando proxies (gateway) */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip')?.trim() || 'local'
}

/** Resposta 429 padrão */
export function tooMany(retryAfterSec: number, message?: string): Response {
  return Response.json(
    { error: message || `Muitas tentativas. Aguarde ${retryAfterSec}s e tente de novo.` },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
  )
}
