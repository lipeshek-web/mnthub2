/**
 * Smoke tests do Sprint 1 (W-29) — roda contra o dev server :3000.
 * Verifica: library canRead só via sessão, tracks progresso via sessão,
 * enroll 402 em curso pago, referrals GET com sessão.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const BASE = 'http://localhost:3000'

let pass = 0
let fail = 0
function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    pass++
    console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`)
  } else {
    fail++
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function main() {
  // ---- login da ana (sessão válida) ----
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ana@demo.com', password: 'demo123' }),
  })
  const login = (await loginRes.json()) as { sessionToken?: string; id?: string; mfaRequired?: boolean; error?: string }
  const token = login.sessionToken
  const anaId = login.id
  check('login ana@demo.com', Boolean(token && anaId), `userId=${anaId?.slice(0, 8)}…${login.mfaRequired ? ' (MFA!)' : ''}${login.error ? ` erro=${login.error}` : ''}`)
  if (!token) return
  const auth = { Authorization: `Bearer ${token}` }

  // ---- #3a: library restrito NÃO abre com userId forjado ----
  const gated = await db.libraryItem.findFirst({
    where: { isPublished: false },
    select: {
      id: true,
      title: true,
      isPublished: true,
      pdfUrl: true,
      content: true,
      lessons: { select: { course: { select: { enrollments: { select: { studentId: true } } } } } },
    },
  })
  if (gated) {
    const enrolledStudent = gated.lessons
      .flatMap((l) => l.course?.enrollments ?? [])
      .map((e) => e.studentId)
      .find((sid) => sid !== anaId)

    // 1) anônimo com userId de um inscrito — antes vazava pdfUrl
    const anonForged = await fetch(
      `${BASE}/api/library/${gated.id}${enrolledStudent ? `?userId=${enrolledStudent}` : ''}`
    )
    const anonForgedBody = (await anonForged.json()) as { canRead?: boolean; pdfUrl?: string | null; content?: string | null }
    check(
      'library: anônimo + userId forjado NÃO ganha conteúdo',
      anonForgedBody.canRead !== true && !anonForgedBody.pdfUrl && !anonForgedBody.content,
      `canRead=${anonForgedBody.canRead}`
    )

    // 2) anônimo puro
    const anonPure = await fetch(`${BASE}/api/library/${gated.id}`)
    const anonPureBody = (await anonPure.json()) as { canRead?: boolean; pdfUrl?: string | null }
    check('library: anônimo sem userId não ganha conteúdo', !anonPureBody.pdfUrl, `canRead=${anonPureBody.canRead}`)

    // 3) logado (ana) com userId de OUTRO na query — sessão vence
    const loggedForged = await fetch(
      `${BASE}/api/library/${gated.id}?userId=${enrolledStudent ?? 'x'}`,
      { headers: auth }
    )
    const loggedForgedBody = (await loggedForged.json()) as { canRead?: boolean }
    console.log(`     (ana canRead=${loggedForgedBody.canRead} — depende de estar inscrita/ser autora)`)
  } else {
    console.log('  ⚠️ sem library item p/ testar gate de conteúdo')
  }

  // ---- #3b: track progresso — sessão vence sobre query userId ----
  const track = await db.track.findFirst({
    select: { id: true, title: true },
  })
  if (track) {
    const otherStudent = await db.user.findFirst({
      where: { id: { not: anaId } },
      select: { id: true },
    })
    const res = await fetch(`${BASE}/api/tracks/${track.id}?userId=${otherStudent?.id ?? 'x'}`, {
      headers: auth,
    })
    const body = (await res.json()) as {
      track?: { myEnrollment?: unknown }
      myEnrollment?: unknown
    }
    const shown = body.track?.myEnrollment ?? body.myEnrollment
    // ana não está inscrita nesta trilha (provavelmente) — deve vir null mesmo passando userId alheio
    check(
      'track: logada não enxerga progresso de outro via query',
      shown == null,
      `myEnrollment=${JSON.stringify(shown)}`
    )
  }

  // ---- #2: enroll em curso pago → 402 ----
  const paidCourse = await db.course.findFirst({
    where: { isPublished: true, price: { gt: 0 } },
    select: { id: true, title: true, price: true },
  })
  if (paidCourse) {
    const res = await fetch(`${BASE}/api/courses/${paidCourse.id}/enroll`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
    })
    check(
      `enroll curso pago (R$${paidCourse.price}) → 402`,
      res.status === 402,
      `status=${res.status}`
    )
  } else {
    console.log('  ⚠️ sem curso pago publicado p/ testar 402')
  }

  // ---- #5: referrals GET usa sessão (não vaza de outro) ----
  const resRef = await fetch(`${BASE}/api/referrals?userId=outro-usuario`, { headers: auth })
  const bodyRef = (await resRef.json()) as { code?: string }
  check('referrals: identidade vem da sessão', resRef.status === 200 && Boolean(bodyRef.code), `code=${bodyRef.code}`)

  // ---- quiz: GET não vaza gabarito para aluno ----
  const quiz = await db.quiz.findFirst({
    select: { id: true, lesson: { select: { course: { select: { id: true } } } } },
  })
  if (quiz) {
    const enrolled = await db.enrollment.findFirst({
      where: { courseId: quiz.lesson.course.id },
      select: { studentId: true },
    })
    if (enrolled) {
      const loginAluno = await db.user.findUnique({ where: { id: enrolled.studentId }, select: { email: true } })
      if (loginAluno) {
        const r2 = await fetch(`${BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginAluno.email, password: 'demo123' }),
        }).catch(() => null)
        if (r2?.ok) {
          const l2 = (await r2.json()) as { token?: string; sessionToken?: string }
          const t2 = l2.token || l2.sessionToken
          if (t2) {
            const rq = await fetch(`${BASE}/api/lessons/${quiz.id}/quizzes`, { headers: { Authorization: `Bearer ${t2}` } }).catch(() => null)
            if (rq?.ok) {
              const quizzes = (await rq.json()) as Array<{ correctIndex: number | null }>
              const leaked = quizzes.some((q) => q.correctIndex !== null)
              check('quiz: aluno NÃO recebe gabarito no GET', !leaked, `${quizzes.length} pergunta(s)`)
            }
          }
        }
      }
    }
  }

  console.log(`\nResultado: ${pass} ok, ${fail} falha(s)`)
  if (fail > 0) process.exitCode = 1
}

main()
  .catch((e) => {
    console.error('Smoke test erro:', e)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
