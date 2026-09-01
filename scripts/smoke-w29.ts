/**
 * Smoke W-29b — session-first nas rotas que derivavam identidade de query/body
 * 1) library/[id]: IDOR de conteúdo (anônimo forjava userId e lia PDF/texto restrito)
 *    + PATCH/DELETE aceitando body.userId/query forjado (mentor.userId é público)
 * 2) tracks/[id]: progresso/matrícula de terceiros via query userId
 * 3) memberships/[id]: status/renewsAt de terceiros via query userId
 * 4) coupons/validate: sessão tem precedência sobre body.userId (escopo NEW_ACCOUNTS)
 *
 * Uso: bun scripts/smoke-w29.ts  (dev server precisa estar no :3000)
 * Cria entidades dedicadas com sufixo único e limpa tudo no final.
 */
import { db } from '../src/lib/db'
import { createSessionToken } from '../src/lib/session'

const BASE = 'http://localhost:3000'
const TAG = `w29${Date.now().toString(36)}`

let fails = 0
const check = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}${extra ? ` (${extra})` : ''}`)
  if (!cond) fails++
}

const api = async (path: string, method: string, token?: string, body?: unknown) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

// ==================== SETUP ====================
const mentorUser = await db.user.create({ data: { email: `mentor-${TAG}@test.local`, name: 'Mentor Smoke W29' } })
const mentor = await db.mentorProfile.create({
  data: { userId: mentorUser.id, headline: 'smoke w29', description: 'smoke w29', hourlyRate: 100, isPublished: true },
})
const course = await db.course.create({
  data: { mentorId: mentor.id, title: `Curso ${TAG}`, description: 'smoke', category: 'Teste', price: 200, isPublished: true },
})
// item NÃO publicado, restrito: só quem estiver inscrito no curso que o usa pode ler
const item = await db.libraryItem.create({
  data: {
    mentorId: mentor.id,
    kind: 'ARTICLE',
    title: `Artigo ${TAG}`,
    description: 'smoke',
    category: 'Teste',
    level: 'INICIANTE',
    isPublished: false,
    content: 'SEGREDO-W29',
    readingMin: 5,
  },
})
await db.lesson.create({ data: { courseId: course.id, title: `Aula ${TAG}`, kind: 'TEXT', libraryItemId: item.id, order: 1 } })
const track = await db.track.create({
  data: { mentorId: mentor.id, title: `Trilha ${TAG}`, description: 'Trilha de smoke W29 com descrição longa', category: 'Teste', isPublished: true },
})
const membership = await db.mentorMembership.create({
  data: { mentorId: mentor.id, title: `Plano ${TAG}`, description: 'smoke', price: 50, isPublished: true },
})
const student = await db.user.create({ data: { email: `aluno-${TAG}@test.local`, name: 'Aluno Smoke W29' } })
const student2 = await db.user.create({ data: { email: `aluno2-${TAG}@test.local`, name: 'Aluno 2 Smoke W29' } })

const studentTok = createSessionToken(student.id).token
const student2Tok = createSessionToken(student2.id).token
const mentorTok = createSessionToken(mentorUser.id).token

// vínculos da aluna: matrícula no curso (dá acesso ao item), na trilha e assinatura ativa
await db.enrollment.create({ data: { courseId: course.id, studentId: student.id, completedLessonIds: '[]' } })
await db.trackEnrollment.create({ data: { trackId: track.id, studentId: student.id } })
await db.membershipSubscription.create({
  data: {
    membershipId: membership.id,
    userId: student.id,
    mentorId: mentor.id,
    status: 'ACTIVE',
    startedAt: new Date(Date.now() - 24 * 3600 * 1000),
    renewsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
  },
})
// student2 já tem compra paga → NEW_ACCOUNTS queimado para ele
await db.order.create({
  data: { courseId: course.id, studentId: student2.id, mentorId: mentor.id, amount: 200, status: 'PAID' },
})
const coupon = await db.coupon.create({
  data: { code: `NOVO${TAG.toUpperCase()}`, percentOff: 10, scope: 'NEW_ACCOUNTS', isActive: true },
})

// ==================== 1) LIBRARY: IDOR DE CONTEÚDO ====================
console.log('\n— 1) library/[id]: IDOR de conteúdo —')
const anonForged = await fetch(`${BASE}/api/library/${item.id}?userId=${student.id}`)
const anonJson = await anonForged.json()
check(
  'anônimo com userId FORJADO de inscrita → canRead false',
  anonForged.status === 200 && anonJson.canRead === false,
  `canRead=${anonJson.canRead}`
)
check('pdfUrl/content NULOS p/ anônimo forjado', anonJson.pdfUrl === null && anonJson.content === null, `content=${JSON.stringify(anonJson.content)}`)
const stuRead = await api(`/api/library/${item.id}`, 'GET', studentTok)
check(
  'aluna autenticada (sem query) → canRead true + conteúdo liberado',
  stuRead.status === 200 && stuRead.json.canRead === true && stuRead.json.content === 'SEGREDO-W29',
  `canRead=${stuRead.json?.canRead}`
)

console.log('\n— 1b) library/[id]: PATCH/DELETE forjando dono —')
const hack = await fetch(`${BASE}/api/library/${item.id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: mentorUser.id, title: 'Hackeado' }),
})
check('PATCH sem token mas com body.userId do dono → 401', hack.status === 401, `status=${hack.status}`)
const titleAfterHack = await db.libraryItem.findUnique({ where: { id: item.id }, select: { title: true } })
check('título NÃO foi alterado pelo ataque', titleAfterHack?.title === `Artigo ${TAG}`, `title=${titleAfterHack?.title}`)
const legit = await api(`/api/library/${item.id}`, 'PATCH', mentorTok, { title: `Artigo ${TAG} v2` })
check('PATCH com token do dono → 200', legit.status === 200, `status=${legit.status}`)

// ==================== 2) TRACKS: PROGRESSO DE TERCEIROS ====================
console.log('\n— 2) tracks/[id]: progresso de terceiros —')
const tAnon = await fetch(`${BASE}/api/tracks/${track.id}?userId=${student.id}`)
const tAnonJson = await tAnon.json()
check(
  'anônimo com userId forjado → myEnrollment null',
  tAnon.status === 200 && tAnonJson.myEnrollment === null,
  `myEnrollment=${JSON.stringify(tAnonJson.myEnrollment)}`
)
const tAuth = await api(`/api/tracks/${track.id}`, 'GET', studentTok)
check('autenticada → myEnrollment presente', tAuth.json?.myEnrollment?.createdAt != null, `myEnrollment=${JSON.stringify(tAuth.json?.myEnrollment)}`)

// ==================== 3) MEMBERSHIPS: STATUS DE TERCEIROS ====================
console.log('\n— 3) memberships/[id]: status de terceiros —')
const mAnon = await fetch(`${BASE}/api/memberships/${membership.id}?userId=${student.id}`)
const mAnonJson = await mAnon.json()
check(
  'anônimo com userId forjado → myStatus null',
  mAnon.status === 200 && mAnonJson.membership?.myStatus === null,
  `myStatus=${mAnonJson.membership?.myStatus}`
)
const mAuth = await api(`/api/memberships/${membership.id}`, 'GET', studentTok)
check(
  'autenticada → myStatus ACTIVE + renewsAt',
  mAuth.json?.membership?.myStatus === 'ACTIVE' && Boolean(mAuth.json?.membership?.renewsAt),
  `myStatus=${mAuth.json?.membership?.myStatus}`
)

// ==================== 4) COUPONS: SESSÃO > BODY.USERID ====================
console.log('\n— 4) coupons/validate: sessão vence body forjado —')
const anonCoupon = await api('/api/coupons/validate', 'POST', undefined, {
  code: coupon.code,
  userId: student.id,
  courseId: course.id,
})
check(
  'anônimo mantém fallback do body.userId (compatibilidade) → ok',
  anonCoupon.status === 200 && anonCoupon.json?.ok === true,
  `status=${anonCoupon.status}`
)
const spoof = await api('/api/coupons/validate', 'POST', studentTok, {
  code: coupon.code,
  userId: student2.id, // forja conta SEM primeira compra
  courseId: course.id,
})
check(
  'sessão vence body forjado (userId real = aluna sem compras) → ok',
  spoof.status === 200 && spoof.json?.ok === true,
  `json=${JSON.stringify(spoof.json).slice(0, 120)}`
)
const burnt = await api('/api/coupons/validate', 'POST', student2Tok, { code: coupon.code, courseId: course.id })
check('student2 (1ª compra já feita) → rejeitado', burnt.status === 400, `status=${burnt.status}`)

// ==================== CLEANUP ====================
console.log('\n— cleanup —')
await db.coupon.delete({ where: { id: coupon.id } })
await db.order.deleteMany({ where: { mentorId: mentor.id } })
await db.membershipSubscription.deleteMany({ where: { membershipId: membership.id } })
await db.mentorMembership.delete({ where: { id: membership.id } })
await db.trackEnrollment.deleteMany({ where: { trackId: track.id } })
await db.track.delete({ where: { id: track.id } })
await db.libraryItem.delete({ where: { id: item.id } })
await db.enrollment.deleteMany({ where: { studentId: { in: [student.id, student2.id] } } })
await db.course.delete({ where: { id: course.id } })
await db.mentorProfile.delete({ where: { id: mentor.id } })
await db.user.deleteMany({ where: { id: { in: [mentorUser.id, student.id, student2.id] } } })
console.log('entidades de teste removidas')

console.log(`\n${fails === 0 ? '✅ TODOS OS CHECKS PASSARAM' : `❌ ${fails} check(s) falharam`}`)
process.exit(fails === 0 ? 0 : 1)
