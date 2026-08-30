import crypto from 'crypto'
import { db } from '@/lib/db'

// ==================== CÓDIGOS DE RECUPERAÇÃO DO MFA ====================
// Cada admin recebe 10 códigos de uso único ao ativar o MFA. Se perder o app
// autenticador, entra com um dos códigos no lugar do TOTP. No banco guardamos
// apenas o SHA-256 de cada código (o texto plano é exibido uma única vez).

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // sem I/L/O/0/1 (confusão visual)
const CODE_BLOCKS = 2
const CODE_BLOCK_LEN = 4
export const RECOVERY_CODES_COUNT = 10

export interface StoredRecoveryCode {
  h: string // sha256 hex do código normalizado
  used: boolean
}

/** Gera um código no formato XXXX-XXXX (sem caracteres ambíguos) */
function randomCode(): string {
  const bytes = crypto.randomBytes(CODE_BLOCKS * CODE_BLOCK_LEN)
  const chars: string[] = []
  for (let i = 0; i < CODE_BLOCKS * CODE_BLOCK_LEN; i++) {
    chars.push(ALPHABET[bytes[i] % ALPHABET.length])
  }
  return `${chars.slice(0, CODE_BLOCK_LEN).join('')}-${chars.slice(CODE_BLOCK_LEN).join('')}`
}

/** Gera um lote novo de códigos plaintext (exibidos uma única vez) */
export function generateRecoveryCodes(count = RECOVERY_CODES_COUNT): string[] {
  const codes = new Set<string>()
  while (codes.size < count) codes.add(randomCode())
  return [...codes]
}

/** Normaliza a digitação: remove traços/espaços e põe em maiúsculas */
export function normalizeRecoveryCode(raw: string): string {
  return (raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** Hash estável de um código normalizado */
export function hashRecoveryCode(normalized: string): string {
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

/** Serializa o lote para o campo User.mfaRecoveryCodes */
export function serializeRecoveryCodes(codes: string[]): string {
  return JSON.stringify(
    codes.map((code) => ({ h: hashRecoveryCode(normalizeRecoveryCode(code)), used: false }))
  )
}

/** Lê o lote do banco (tolerante a dados corrompidos) */
export function parseRecoveryCodes(json: string | null | undefined): StoredRecoveryCode[] {
  if (!json) return []
  try {
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((e) => e && typeof e.h === 'string')
      .map((e) => ({ h: e.h as string, used: Boolean(e.used) }))
  } catch {
    return []
  }
}

export interface RecoveryConsumeResult {
  ok: boolean
  remaining: number
}

/**
 * Verifica um código de recuperação e consome (marca como usado) quando válido.
 * Códigos já usados ou desconhecidos falham sem diferenciar o motivo.
 */
export async function verifyAndConsumeRecoveryCode(
  userId: string,
  rawCode: string
): Promise<RecoveryConsumeResult> {
  const normalized = normalizeRecoveryCode(rawCode)
  if (normalized.length < 6) return { ok: false, remaining: -1 }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mfaRecoveryCodes: true },
  })
  const entries = parseRecoveryCodes(user?.mfaRecoveryCodes)
  if (entries.length === 0) return { ok: false, remaining: 0 }

  const hash = hashRecoveryCode(normalized)
  const index = entries.findIndex((e) => !e.used && e.h === hash)
  if (index === -1) {
    const remaining = entries.filter((e) => !e.used).length
    return { ok: false, remaining }
  }

  entries[index].used = true
  await db.user.update({
    where: { id: userId },
    data: { mfaRecoveryCodes: JSON.stringify(entries) },
  })
  return { ok: true, remaining: entries.filter((e) => !e.used).length }
}

/** Quantos códigos ainda válidos o usuário tem */
export function countRemainingCodes(json: string | null | undefined): number {
  return parseRecoveryCodes(json).filter((e) => !e.used).length
}
