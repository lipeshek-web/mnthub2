/**
 * Backup automático do banco local: 1x no boot do servidor + a cada 6h
 * (prune mantém os 30 mais recentes). Silencioso — nunca atrasa ou quebra
 * o servidor. Em modo nuvem (Turso) não faz nada (não há arquivo local).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  try {
    const { createBackup } = await import('@/lib/db-backup')
    void createBackup('boot').catch(() => {})
    const timer = setInterval(() => {
      void createBackup('interval').catch(() => {})
    }, 6 * 60 * 60 * 1000)
    if (typeof timer.unref === 'function') timer.unref()
  } catch {
    /* silencioso */
  }
}
