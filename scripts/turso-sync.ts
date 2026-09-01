#!/usr/bin/env bun
/**
 * Migra o banco local para um banco Turso/libSQL (nuvem) — a solução
 * definitiva contra perda de dados em atualizações: com o app em modo nuvem,
 * TODOS os dados (gateway, cursos, alunos, perguntas...) vivem fora do
 * sandbox e sobrevivem a qualquer rebuild.
 *
 * Passos:
 *  1. Crie um banco gratuito em https://turso.tech
 *  2. Defina no ambiente (.env ou export):
 *       TURSO_DATABASE_URL=libsql://seu-banco-sua-org.turso.io
 *       TURSO_AUTH_TOKEN=eyJ...
 *  3. Rode: bun run db:to-turso
 *  4. Reinicie o servidor — o app passa a gravar na nuvem automaticamente.
 *
 * Idempotente: cria o schema se não existir e usa INSERT OR REPLACE,
 * então pode rodar mais de uma vez.
 */
import { spawnSync } from 'node:child_process'
import { createClient, type InStatement } from '@libsql/client'
import { localDbPath } from '../src/lib/db-backup'

const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || ''

if (!url) {
  console.error('[db:to-turso] Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN antes de sincronizar.')
  console.error('[db:to-turso] Ex.: TURSO_DATABASE_URL=libsql://meu-banco.turso.io TURSO_AUTH_TOKEN=... bun run db:to-turso')
  process.exit(1)
}

// ---------- 1. DDL completo a partir do schema.prisma ----------
const diff = spawnSync(
  'bunx',
  ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'],
  { encoding: 'utf8' }
)
if (diff.status !== 0 || !diff.stdout) {
  console.error('[db:to-turso] Falha ao gerar o DDL do schema:', diff.stderr || diff.stdout)
  process.exit(1)
}
const statements = diff.stdout
  .split('--> statement-breakpoint')
  .map((s) => s.trim())
  .filter(Boolean)

const remote = createClient({ url, authToken: authToken || undefined })

console.log(`[db:to-turso] Aplicando schema (${statements.length} statements) no Turso...`)
for (const stmt of statements) {
  await remote.execute(stmt)
}

// ---------- 2. Copiar os dados do arquivo local ----------
const local = createClient({ url: `file:${localDbPath()}` })
const tablesResult = await local.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'"
)
const tables = tablesResult.rows.map((r) => String(r.name))

console.log(`[db:to-turso] Copiando dados de ${tables.length} tabelas...`)
for (const table of tables) {
  const rows = await local.execute({ sql: `SELECT * FROM "${table}"`, args: [] })
  if (rows.rows.length === 0) {
    console.log(`  - ${table}: 0 linhas`)
    continue
  }
  const cols = rows.columns
  const colList = cols.map((c) => `"${c}"`).join(', ')
  const placeholders = cols.map(() => '?').join(', ')
  const insertSql = `INSERT OR REPLACE INTO "${table}" (${colList}) VALUES (${placeholders})`

  let copied = 0
  let batch: InStatement[] = []
  const flush = async () => {
    if (batch.length === 0) return
    await remote.batch(batch, 'write')
    copied += batch.length
    batch = []
  }
  for (const row of rows.rows) {
    batch.push({ sql: insertSql, args: cols.map((c) => (row[c] ?? null) as never) })
    if (batch.length >= 200) await flush()
  }
  await flush()
  console.log(`  - ${table}: ${copied} linhas`)
}

console.log('[db:to-turso] Pronto! Com TURSO_DATABASE_URL/TURSO_AUTH_TOKEN definidos, o app usa a nuvem.')
console.log('[db:to-turso] Reinicie o servidor para o modo nuvem valer.')
