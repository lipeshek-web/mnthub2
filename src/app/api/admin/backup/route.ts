import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { audit, requireAdmin } from '@/lib/admin-auth'
import {
  backupDir,
  createBackup,
  isTursoConfigured,
  listBackups,
  localDbPath,
  localDbSizeBytes,
} from '@/lib/db-backup'

export const dynamic = 'force-dynamic'

/**
 * Persistência dos dados — protege contra perda em atualizações.
 *  GET               : status (modo local/nuvem, tamanho, snapshots existentes)
 *  GET ?export=json  : exportação completa de TODAS as tabelas (download JSON)
 *  POST              : cria um snapshot agora (modo arquivo)
 *  PUT { file }      : restaura um snapshot (faz backup do estado atual antes)
 *
 * Modo nuvem (Turso definido): arquivo local não existe — POST/PUT ficam
 * indisponíveis e a proteção é a própria nuvem + exportação JSON.
 */

/** Ordem das tabelas na exportação (todas do schema) */
const TABLES = [
  'user',
  'mentorProfile',
  'availability',
  'contentPost',
  'booking',
  'review',
  'course',
  'courseTheme',
  'libraryItem',
  'lesson',
  'enrollment',
  'quiz',
  'quizAttempt',
  'xpEvent',
  'lessonQuestion',
  'lessonNote',
  'aiLessonSummary',
  'track',
  'trackItem',
  'trackEnrollment',
  'order',
  'trackingEvent',
  'notification',
  'courseReview',
  'certificate',
  'coupon',
  'bundle',
  'mentorMembership',
  'membershipSubscription',
  'weeklyGoal',
  'bundleItem',
  'referral',
  'directMessage',
  'payment',
  'platformSetting',
  'adminSession',
  'mfaChallenge',
  'passwordResetToken',
  'emailOutbox',
  'meetingNote',
  'auditLog',
] as const

async function buildStatus() {
  const turso = isTursoConfigured()
  return {
    mode: turso ? ('turso' as const) : ('local' as const),
    dbPath: turso ? null : localDbPath(),
    dbSizeBytes: turso ? 0 : await localDbSizeBytes(),
    backups: turso ? [] : await listBackups(),
  }
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error

  const exportJson = new URL(req.url).searchParams.get('export') === 'json'

  if (exportJson) {
    try {
      const data: Record<string, unknown> = {}
      let records = 0
      for (const table of TABLES) {
        const rows = await (db as any)[table].findMany()
        data[table] = rows
        records += rows.length
      }
      const payload = {
        _meta: {
          app: 'MentorHub',
          kind: 'full-export',
          exportedAt: new Date().toISOString(),
          mode: isTursoConfigured() ? 'turso' : 'local',
          tables: TABLES.length,
          records,
        },
        ...data,
      }
      await audit(guard.actor, 'data.export_json', { records })
      const stamp = new Date().toISOString().slice(0, 10)
      return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="mentorhub-export-${stamp}.json"`,
        },
      })
    } catch (err) {
      console.error('GET /api/admin/backup?export=json', err)
      return NextResponse.json({ error: 'Erro ao exportar os dados.' }, { status: 500 })
    }
  }

  try {
    return NextResponse.json(await buildStatus())
  } catch (err) {
    console.error('GET /api/admin/backup', err)
    return NextResponse.json({ error: 'Erro ao carregar status de persistência.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error

  if (isTursoConfigured()) {
    return NextResponse.json(
      { error: 'Banco em modo nuvem (Turso): não há arquivo local para snapshot. Use a exportação JSON.' },
      { status: 400 }
    )
  }

  try {
    const backup = await createBackup('admin')
    if (!backup) {
      return NextResponse.json({ error: 'Nenhum arquivo de banco local encontrado.' }, { status: 404 })
    }
    await audit(guard.actor, 'data.backup_create', { file: backup.file, sizeBytes: backup.sizeBytes })
    return NextResponse.json({ ok: true, backup, ...(await buildStatus()) })
  } catch (err) {
    console.error('POST /api/admin/backup', err)
    return NextResponse.json({ error: 'Erro ao criar o snapshot.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error

  if (isTursoConfigured()) {
    return NextResponse.json(
      { error: 'Banco em modo nuvem (Turso): restauração de arquivo não se aplica.' },
      { status: 400 }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const requested = String(body?.file ?? '').trim()
    if (!requested) {
      return NextResponse.json({ error: 'Informe o snapshot a restaurar.' }, { status: 400 })
    }

    // path.basename impede traversal ("../..") — só arquivos DENTRO de /backups
    const target = path.join(backupDir(), path.basename(requested))
    try {
      await fs.access(target)
    } catch {
      return NextResponse.json({ error: 'Snapshot não encontrado.' }, { status: 404 })
    }

    // Segurança primeiro: snapshot do estado atual antes de sobrescrever
    const safety = await createBackup('pre-restore')
    await fs.copyFile(target, localDbPath())
    await audit(guard.actor, 'data.backup_restore', { from: path.basename(requested), safety: safety?.file ?? null })

    return NextResponse.json({
      ok: true,
      restoredFrom: path.basename(requested),
      safetyBackup: safety?.file ?? null,
      note: 'Banco restaurado. Recomenda-se reiniciar o servidor para renovar as conexões.',
      ...(await buildStatus()),
    })
  } catch (err) {
    console.error('PUT /api/admin/backup', err)
    return NextResponse.json({ error: 'Erro ao restaurar o snapshot.' }, { status: 500 })
  }
}
