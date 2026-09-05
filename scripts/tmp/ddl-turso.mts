#!/usr/bin/env bun
/**
 * Aplica APENAS o DDL (schema.prisma) no Turso — sem copiar dados.
 * Idempotente: ignora erros "already exists". Uso:
 *   set -a; source .zscripts/cloud.env; set +a; bun scripts/tmp/ddl-turso.mts
 */
import { createClient } from '@libsql/client'
import { spawnSync } from 'node:child_process'

const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || ''
if (!url) {
  console.error('Defina TURSO_DATABASE_URL/TURSO_AUTH_TOKEN')
  process.exit(1)
}

const diff = spawnSync(
  'bunx',
  ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'],
  { encoding: 'utf8' }
)
if (diff.status !== 0 || !diff.stdout) {
  console.error('Falha ao gerar DDL:', diff.stderr || diff.stdout)
  process.exit(1)
}
const statements = diff.stdout
  .split(/\n\s*\n/)
  .map((block) =>
    block.split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n').trim()
  )
  .filter(Boolean)

const remote = createClient({ url, authToken: authToken || undefined })
console.log(`Aplicando schema (${statements.length} statements) no Turso...`)
let applied = 0
for (const stmt of statements) {
  try {
    await remote.execute(stmt)
    applied++
  } catch (e) {
    if (!/already exists/i.test(String((e as Error)?.message ?? e))) throw e
  }
}
console.log(`OK — ${applied} statements novos aplicados (restantes já existiam).`)
