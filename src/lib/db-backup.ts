import { promises as fs } from 'node:fs'
import path from 'node:path'

/**
 * Snapshots locais do banco de dados (SQLite em modo arquivo).
 *
 * Por que isso existe: o ambiente pode ser reconstruído a cada atualização de
 * código e, sem isso, dados salvos em runtime (ex.: chave do gateway no painel
 * admin, em PlatformSetting) somem. Estratégia em camadas:
 *  1. Backup automático do arquivo em /backups (boot + a cada 6h + antes de
 *     cada `prisma db push`) — ver src/instrumentation.ts e scripts/db-safe-push.ts
 *  2. Export JSON completo no painel admin (/api/admin/backup?export=json)
 *  3. Modo nuvem (Turso/libSQL): definindo TURSO_DATABASE_URL/TURSO_AUTH_TOKEN
 *     o Prisma passa a gravar num banco EXTERNO que sobrevive a qualquer
 *     atualização (scripts/turso-sync.ts migra os dados existentes).
 */

/** Diretório dos snapshots (mantido fora do git para não inflar o repositório) */
export function backupDir(): string {
  return path.join(process.cwd(), 'backups')
}

/** Caminho absoluto do arquivo SQLite local a partir de DATABASE_URL */
export function localDbPath(): string {
  const url = process.env.DATABASE_URL ?? 'file:./db/custom.db'
  if (url.startsWith('file:')) {
    const p = url.slice('file:'.length)
    return path.isAbsolute(p) ? p : path.join(process.cwd(), p)
  }
  return path.join(process.cwd(), 'db', 'custom.db')
}

/** true quando o app está configurado para gravar em banco Turso/libSQL (nuvem) */
export function isTursoConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL)
}

export interface DbBackupInfo {
  file: string
  sizeBytes: number
  createdAt: string
  reason: string | null
}

/** Lista os snapshots existentes (mais recentes primeiro) */
export async function listBackups(): Promise<DbBackupInfo[]> {
  try {
    const dir = backupDir()
    const names = (await fs.readdir(dir)).filter((n) => n.endsWith('.db')).sort().reverse()
    return await Promise.all(
      names.map(async (name) => {
        const stat = await fs.stat(path.join(dir, name))
        const reason = name.includes('--') ? (name.split('--')[1]?.replace(/\.db$/, '') ?? null) : null
        return { file: name, sizeBytes: stat.size, createdAt: stat.mtime.toISOString(), reason }
      })
    )
  } catch {
    return []
  }
}

/**
 * Cria um snapshot do banco local em /backups. Retorna null quando o app roda
 * em modo nuvem (não há arquivo para copiar) ou o arquivo ainda não existe.
 */
export async function createBackup(reason = 'manual'): Promise<DbBackupInfo | null> {
  if (isTursoConfigured()) return null
  const src = localDbPath()
  try {
    await fs.access(src)
  } catch {
    return null
  }
  try {
    await fs.mkdir(backupDir(), { recursive: true })
    const now = new Date()
    const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19) // 2026-02-08T15-30-00
    const safeReason = reason.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'manual'
    const file = `db-${stamp}--${safeReason}.db`
    await fs.copyFile(src, path.join(backupDir(), file))
    await pruneBackups()
    const stat = await fs.stat(path.join(backupDir(), file))
    return { file, sizeBytes: stat.size, createdAt: now.toISOString(), reason: safeReason }
  } catch (err) {
    console.error('createBackup falhou (silencioso)', err)
    return null
  }
}

/** Mantém apenas os `keep` snapshots mais recentes */
export async function pruneBackups(keep = 30): Promise<void> {
  try {
    const dir = backupDir()
    const files = (await fs.readdir(dir)).filter((n) => n.endsWith('.db')).sort()
    const excess = files.slice(0, Math.max(0, files.length - keep))
    await Promise.all(excess.map((n) => fs.rm(path.join(dir, n), { force: true })))
  } catch {
    /* silencioso */
  }
}

/** Tamanho do banco local (0 quando indisponível/nuvem) */
export async function localDbSizeBytes(): Promise<number> {
  try {
    const stat = await fs.stat(localDbPath())
    return stat.size
  } catch {
    return 0
  }
}
