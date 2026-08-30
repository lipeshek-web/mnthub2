import crypto from 'crypto'

// ==================== TOTP (RFC 6238) — MFA da administração ====================
// Implementação padrão (HMAC-SHA1, passo de 30s, 6 dígitos) compatível com
// Google Authenticator, Authy, Microsoft Authenticator, 1Password etc.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** Gera um segredo TOTP aleatório em base32 (20 bytes = 32 chars) */
export function generateTotpSecret(): string {
  const buf = crypto.randomBytes(20)
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return output
}

/** Decodifica base32 (padrão RFC 4648, sem padding) para Buffer */
function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const char of clean) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(char)
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

/** Calcula o código HOTP (RFC 4226) para um contador */
function hotp(secret: Buffer, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter >>> 0, 4)
  const hmac = crypto.createHmac('sha1', secret).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return (code % 10 ** digits).toString().padStart(digits, '0')
}

/**
 * Verifica um código TOTP com janela de tolerância (padrão ±1 passo de 30s
 * para cobrir desvio de relógio). Comparação em tempo constante contra o
 * código informado pelo usuário.
 */
export function verifyTotp(secretB32: string, token: string, window = 1): boolean {
  const clean = (token ?? '').replace(/\D/g, '')
  if (clean.length !== 6) return false
  const secret = base32Decode(secretB32)
  if (secret.length === 0) return false
  const step = Math.floor(Date.now() / 1000 / 30)
  const tokenBuf = Buffer.from(clean)
  for (let drift = -window; drift <= window; drift++) {
    const candidate = Buffer.from(hotp(secret, step + drift))
    if (candidate.length === tokenBuf.length && crypto.timingSafeEqual(candidate, tokenBuf)) {
      return true
    }
  }
  return false
}

/** Gera o código TOTP atual (uso interno/testes) */
export function currentTotp(secretB32: string): string {
  return hotp(base32Decode(secretB32), Math.floor(Date.now() / 1000 / 30))
}

/** URI otpauth:// para apps autenticadores */
export function otpauthUri(secretB32: string, account: string): string {
  const label = encodeURIComponent(`MentorHub:${account}`)
  return `otpauth://totp/${label}?secret=${secretB32}&issuer=MentorHub&algorithm=SHA1&digits=6&period=30`
}
