import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Modo nuvem (Turso/libSQL): definindo TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN)
 * o Prisma grava num banco EXTERNO — dados sobrevivem a qualquer atualização
 * de código/rebuild do sandbox. Sem as variáveis, comporta-se como sempre:
 * SQLite local em db/custom.db (DATABASE_URL).
 * Migração pontual local -> nuvem: bun run db:to-turso
 */
function resolveCloud(): { url: string; authToken?: string } | null {
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL
  if (!url) return null
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || undefined
  return { url, authToken }
}

function makeDb(): PrismaClient {
  const cloud = resolveCloud()
  if (cloud) {
    const adapter = new PrismaLibSQL({ url: cloud.url, authToken: cloud.authToken })
    return new PrismaClient({ adapter, log: ['error'] })
  }
  return new PrismaClient({
    log: process.env.DEBUG_PRISMA === '1' ? ['query'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? makeDb()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
