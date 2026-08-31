'use client'

// ============================================================
// Programa de indicação — captura do código de convite (?ref=).
// Mesmo padrão da atribuição de tráfego (lib/tracking.ts):
// persiste no localStorage por 7 dias e é enviado no cadastro.
// ============================================================

const REF_KEY = 'mh_referral_v1'
const REF_TTL_MS = 7 * 24 * 60 * 60 * 1000 // janela do convite: 7 dias

interface StoredRef {
  code: string
  updatedAt: number
}

/** Captura ?ref=CODE da URL e persiste por 7 dias (idempotente) */
export function captureRefCodeFromUrl(): void {
  try {
    const sp = new URLSearchParams(window.location.search)
    const code = (sp.get('ref') || '').trim().toUpperCase().slice(0, 24)
    if (!code) return
    localStorage.setItem(
      REF_KEY,
      JSON.stringify({ code, updatedAt: Date.now() } satisfies StoredRef)
    )
  } catch {
    /* localStorage indisponível — convite simplesmente não é aplicado */
  }
}

/** Código de convite armazenado (null se expirado/ausente) */
export function getStoredRefCode(): string | null {
  try {
    const raw = localStorage.getItem(REF_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredRef
    if (!parsed?.code || Date.now() - parsed.updatedAt > REF_TTL_MS) {
      localStorage.removeItem(REF_KEY)
      return null
    }
    return parsed.code
  } catch {
    return null
  }
}

/** Remove o convite armazenado (chamado após aplicar no cadastro) */
export function clearStoredRefCode(): void {
  try {
    localStorage.removeItem(REF_KEY)
  } catch {
    /* noop */
  }
}
