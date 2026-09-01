#!/usr/bin/env bun
/**
 * Snapshot do banco local -> /backups (mantém os 30 mais recentes).
 * Uso: bun run db:backup [motivo]
 */
import { createBackup, isTursoConfigured } from '../src/lib/db-backup'

const reason = process.argv[2] ?? 'cli'

if (isTursoConfigured()) {
  console.log('[db:backup] Banco em modo nuvem (Turso/libSQL): nao ha arquivo local para copiar.')
  console.log('[db:backup] Use a exportacao JSON completa no painel admin (aba Dados).')
  process.exit(0)
}

const backup = await createBackup(reason)
if (backup) {
  console.log(`[db:backup] Snapshot criado: backups/${backup.file} (${Math.round(backup.sizeBytes / 1024)} KB)`)
} else {
  console.log('[db:backup] Nenhum banco local encontrado para copiar ainda (db/custom.db).')
}
