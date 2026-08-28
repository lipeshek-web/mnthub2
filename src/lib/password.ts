// Hash de senha com scrypt (node:crypto) — uso exclusivo no servidor
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const KEY_LEN = 64

/** Gera "salt:hash" para armazenar no User.passwordHash */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, KEY_LEN).toString('hex')
  return `${salt}:${hash}`
}

/** Compara a senha informada com o hash armazenado (constant-time) */
export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.includes(':')) return false
  const [salt, hash] = stored.split(':')
  try {
    const expected = Buffer.from(hash, 'hex')
    const actual = scryptSync(password, salt, KEY_LEN)
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}
