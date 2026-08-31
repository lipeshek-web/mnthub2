/**
 * Task 13-h — preparação de dados (idempotente):
 * login Ana → verifica se há curso 100% concluído → se não, conclui todas as
 * aulas do curso "Do Zero a Product Manager" (Marina) via PATCH /api/courses/[id]/enroll.
 * NÃO emite o certificado via API (a emissão deve ser testada pela UI).
 */
const B = 'http://localhost:3000'

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(`${res.status} ${url}: ${data.error ?? '?'}`)
  return data
}

async function main() {
  const login = await j<{ id: string; name: string }>(`${B}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'ana@demo.com', password: 'demo123' }),
  })
  const ana = login.id
  console.log('ANA_ID=' + ana, '|', login.name)

  const enr = await j<
    Array<{ course: { id: string; title: string; lessonCount: number }; completedLessonIds: string[] }>
  >(`${B}/api/enrollments?userId=${ana}`)

  let complete = 0
  for (const e of enr) {
    const full = e.course.lessonCount > 0 && e.completedLessonIds.length >= e.course.lessonCount
    if (full) complete++
    console.log(`ENR ${e.course.id} | ${e.course.title} | aulas=${e.course.lessonCount} done=${e.completedLessonIds.length} ${full ? 'COMPLETO' : ''}`)
  }

  let target = enr.find(
    (e) => e.course.lessonCount > 0 && e.completedLessonIds.length >= e.course.lessonCount
  )
  let preCompleted = true
  if (!target) {
    target = enr.find((e) => e.course.title.toLowerCase().includes('product manager'))
    preCompleted = false
  }
  if (!target) throw new Error('Nenhum curso alvo encontrado para a Ana')

  // Se o curso escolhido já estava 100%, ainda assim garantimos via PATCH (idempotente)
  const detail = await j<{
    id: string
    title: string
    lessons: Array<{ id: string; title: string }>
    enrollment: { completedLessonIds: string[] } | null
    certificateCode: string | null
  }>(`${B}/api/courses/${target.course.id}?userId=${ana}`)

  const done = new Set(detail.enrollment?.completedLessonIds ?? [])
  for (const l of detail.lessons) {
    if (!done.has(l.id)) {
      await j(`${B}/api/courses/${detail.id}/enroll`, {
        method: 'PATCH',
        body: JSON.stringify({ userId: ana, lessonId: l.id }),
      })
      console.log(`PATCH done: ${l.title}`)
    }
  }

  const after = await j<{
    lessons: Array<{ id: string }>
    enrollment: { completedLessonIds: string[] } | null
    certificateCode: string | null
  }>(`${B}/api/courses/${detail.id}?userId=${ana}`)
  const doneCount = after.enrollment?.completedLessonIds.length ?? 0
  console.log(`TARGET=${detail.id} | ${detail.title} | ${doneCount}/${after.lessons.length} concluídas`)
  console.log('CERT_BEFORE=' + (after.certificateCode ?? 'null'))
  console.log('PRE_COMPLETED=' + (preCompleted && doneCount >= after.lessons.length ? 'yes' : 'no'))
  if (doneCount < after.lessons.length) throw new Error('Falha ao completar 100% das aulas')
}

main().catch((e) => {
  console.error('PREP ERROR:', e.message)
  process.exit(1)
})
