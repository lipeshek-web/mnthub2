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
    // Cast necessário: @prisma/client (6.11.x patchado) endureceu o tipo do
    // adapter e divergiu do @prisma/adapter-libsql 6.11.1 (o tipo correto não
    // é mais exportado). Em runtime o adapter funciona (validado em smoke) —
    // apenas a tipagem diverge; o cast usa o próprio tipo esperado pelo client.
    type ClientOptions = ConstructorParameters<typeof PrismaClient>[0]
    const adapter = new PrismaLibSQL({ url: cloud.url, authToken: cloud.authToken })
    return new PrismaClient({ adapter, log: ['error'] } as unknown as ClientOptions)
  }
  return new PrismaClient({
    log: process.env.DEBUG_PRISMA === '1' ? ['query'] : ['error'],
  })
}

/** Cliente base (sem extensões) — guardado p/ poder reconectar no self-heal */
const baseDb = globalForPrisma.prisma ?? makeDb()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = baseDb

/**
 * AUTO-RECUPERAÇÃO (SQLite readonly): se o ARQUIVO do banco for substituído
 * com o servidor vivo (git checkout/pull do db/custom.db, restauração de
 * snapshot), o SQLite devolve READONLY_DBMOVED — "attempt to write a readonly
 * database" — e TODA escrita falha até o processo reiniciar (o pool mantém o
 * handle do inode antigo). Detectamos o erro, derrubamos o pool ($disconnect)
 * e reabrimos ($connect); a operação é reexecutada UMA única vez contra o
 * arquivo novo. Idempotente e sem loop: se continuar falhando, o erro segue
 * como antes. Com Turso (banco remoto) esse erro não existe.
 */
function isReadonlyDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /attempt to write a readonly database|readonly database|database has been (moved|deleted)|READONLY_DBMOVED/i.test(
    msg
  )
}

/** Uma única recuperação por vez (evita tempestade de disconnect/connect) */
let healPromise: Promise<void> | null = null
async function healConnection(): Promise<void> {
  if (healPromise) return healPromise
  healPromise = (async () => {
    try {
      await baseDb.$disconnect()
    } catch {
      /* pool já morto — seguir */
    }
    try {
      await baseDb.$connect()
    } catch {
      /* reconexão falhou: o retry abaixo reportará o erro real */
    }
  })()
  try {
    await healPromise
  } finally {
    healPromise = null
  }
}

/**
 * Cliente exportado no app inteiro. A extensão só intercepta erros readonly —
 * zero overhead no caminho feliz (a query passa direto pelo pipeline normal).
 */
export const db = baseDb.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        try {
          return await query(args)
        } catch (err) {
          if (!isReadonlyDbError(err)) throw err
          await healConnection()
          return await query(args)
        }
      },
    },
  },
})
