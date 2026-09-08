#!/usr/bin/env bun
/**
 * BACKUP REVERSO: Turso (nuvem) → arquivo SQLite local.
 *
 * O espelho de scripts/turso-sync.ts (db:to-turso). Enquanto o sync normal
 * empurra o local para a nuvem, ESTE puxa a nuvem para o sandbox — um
 * snapshot de segurança do banco PRINCIPAL. Rodar de vez em quando (ou antes
 * de operações arriscadas) garante que, mesmo num cenário extremo de perda
 * do banco remoto, existe uma cópia recente local.
 *
 * Uso:
 *   set -a; source .zscripts/cloud.env; set +a; bun run db:from-turso
 * Saída: db/turso-backup-<ISO>.db (+ ponteiro db/turso-backup-latest.db)
 *
 * Idempotente e seguro: nunca escreve no banco remoto; grava só no arquivo
 * novo (INSERT OR REPLACE, ordem topológica pais→filhos).
 */
import { createClient, type InStatement } from '@libsql/client'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || ''
if (!url) {
  console.error('[db:from-turso] Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN (source .zscripts/cloud.env).')
  process.exit(1)
}

const outPath = path.join(process.cwd(), 'db', `turso-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`)
fs.mkdirSync(path.dirname(outPath), { recursive: true })

// ---------- 1. Criar o arquivo local com o MESMO schema do projeto ----------
const diff = spawnSync(
  'bunx',
  ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'],
  { encoding: 'utf8' }
)
if (diff.status !== 0 || !diff.stdout) {
  console.error('[db:from-turso] Falha ao gerar o DDL do schema:', diff.stderr || diff.stdout)
  process.exit(1)
}
const statements = diff.stdout
  .split(/\n\s*\n/)
  .map((block) =>
    block
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('--'))
      .join('\n')
      .trim()
  )
  .filter(Boolean)

const local = createClient({ url: `file:${outPath}` })
for (const stmt of statements) {
  try {
    await local.execute(stmt)
  } catch (e) {
    if (!/already exists/i.test(String((e as Error)?.message ?? e))) throw e
  }
}

// ---------- 2. Copiar os dados do Turso (ordem topológica pais→filhos) ----------
const remote = createClient({ url, authToken: authToken || undefined })

const tablesResult = await remote.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'"
)
const tables = tablesResult.rows.map((r) => String(r.name))

// ---------- 2b. Ordem topológica (pais antes dos filhos) ----------
// Mesma receita do turso-sync.ts: Kahn sobre PRAGMA foreign_key_list lida na
// ORIGEM (Turso) — copiar filho antes do pai estoura FOREIGN KEY constraint.
const deps = new Map<string, Set<string>>()
for (const table of tables) {
  const fks = await remote.execute(`PRAGMA foreign_key_list("${table}")`)
  deps.set(
    table,
    new Set(fks.rows.map((r) => String(r[2])).filter((t) => tables.includes(t) && t !== table))
  )
}
const sorted: string[] = []
{
  const done = new Set<string>()
  let pending = [...tables]
  while (pending.length > 0) {
    const ready = pending.filter((t) => [...(deps.get(t) ?? [])].every((d) => done.has(d)))
    if (ready.length === 0) {
      // Ciclo: insere na ordem restante — as FKs do schema Órbita não têm ciclos
      sorted.push(...pending)
      break
    }
    for (const t of ready) {
      sorted.push(t)
      done.add(t)
    }
    pending = pending.filter((t) => !done.has(t))
  }
}

let totalRows = 0
for (const table of sorted) {
  const colsResult = await remote.execute(`PRAGMA table_info("${table}")`)
  const cols = colsResult.rows.map((r) => String(r.name))
  if (cols.length === 0) continue
  const colList = cols.map((c) => `"${c}"`).join(', ')
  const ph = cols.map(() => '?').join(', ')

  let offset = 0
  let rows = 0
  const CHUNK = 200
  for (;;) {
    const page: InStatement = {
      sql: `SELECT ${colList} FROM "${table}" LIMIT ${CHUNK} OFFSET ${offset}`,
      args: [],
    }
    const res = await remote.execute(page.sql)
    if (res.rows.length === 0) break
    for (const row of res.rows) {
      const values = Array.from(row).map((v) =>
        typeof v === 'bigint' ? Number(v) : (v as string | number | null | Uint8Array)
      )
      await local.execute({
        sql: `INSERT OR REPLACE INTO "${table}" (${colList}) VALUES (${ph})`,
        args: values as never[],
      })
      rows++
    }
    offset += res.rows.length
    if (res.rows.length < CHUNK) break
  }
  totalRows += rows
  if (rows > 0) console.log(`  ${table}: ${rows} linhas`)
}

await local.close()
// Ponteiro prático: cópia estável do snapshot mais recente
fs.cpSync(outPath, path.join(process.cwd(), 'db', 'turso-backup-latest.db'))
console.log(`\n✅ Snapshot do Turso salvo em ${path.relative(process.cwd(), outPath)} (${totalRows} linhas).`)
console.log(`   Cópia estável: db/turso-backup-latest.db`)
