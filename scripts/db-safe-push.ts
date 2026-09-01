#!/usr/bin/env bun
/**
 * `prisma db push` SEGURO — o antigo script rodava com --accept-data-loss,
 * o que apagava dados silenciosamente quando o schema tinha mudança destrutiva
 * (coluna removida, tipo alterado...). Era assim que configurações salvas
 * (ex.: chave do gateway em PlatformSetting) desapareciam "do nada".
 *
 * Agora: (1) snapshot automatico em /backups antes de qualquer push e
 * (2) push SEM --accept-data-loss — mudança destrutiva FALHA com explicação,
 * nunca perde dados sem decisão consciente.
 *
 * Mudança destrutiva intencional? Rode `bun run db:push:force` sabendo que
 * o snapshot anterior já está salvo em /backups.
 */
import { spawnSync } from 'node:child_process'
import { createBackup, isTursoConfigured } from '../src/lib/db-backup'

if (isTursoConfigured()) {
  console.log('[db:push] Atenção: TURSO_DATABASE_URL definido — o app está em modo nuvem.')
  console.log('[db:push] Este push aplica o schema no arquivo local; para aplicar no banco da nuvem, rode o push com a DATABASE_URL apontando para ele (ou sincronize com `bun run db:to-turso`).')
}

const backup = await createBackup('pre-push')
if (backup) {
  console.log(`[db:push] Snapshot de segurança criado antes do push: backups/${backup.file}`)
}

const result = spawnSync('bunx', ['prisma', 'db', 'push'], { stdio: 'inherit' })

if (result.status !== 0) {
  console.log('')
  console.log('[db:push] O push foi BLOQUEADO — provável mudança DESTRUTIVA no schema.')
  console.log('  • Seus dados estão seguros: o snapshot anterior a este push está em /backups.')
  console.log('  • Prefira mudanças aditivas (colunas novas nullable, tabelas novas).')
  console.log('  • Se remover/alterar colunas é INTENCIONAL, rode: bun run db:push:force')
  process.exit(result.status ?? 1)
}

console.log('[db:push] Schema aplicado sem perda de dados.')
