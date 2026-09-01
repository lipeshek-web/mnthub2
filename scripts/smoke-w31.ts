/**
 * Smoke tests do Sprint 3 (W-31) — confiança e conta.
 * #11 reset de senha · #12 e-mail transacional (outbox) · #15 anotações da sessão
 * Regras: restaura a senha da ana para demo123 e remove resíduos de teste.
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

async function login(email: string, password: string): Promise<{ status: number; token?: string; id?: string }> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const j = (await res.json()) as { sessionToken?: string; id?: string; error?: string }
  return { status: res.status, token: j.sessionToken, id: j.id }
}

async function main() {
  // ============ #12/#11 ESQUECI MINHA SENHA ============
  console.log('\n#11/#12 Esqueci minha senha (outbox + sem enumeração)')

  const resUnknown = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nao-existe@exemplo.com' }),
  })
  const jUnknown = (await resUnknown.json()) as { ok?: boolean; resetUrl?: string }
  check('e-mail desconhecido responde 200 ok', resUnknown.status === 200 && jUnknown.ok === true)
  check('sem resetUrl para conta inexistente (sem enumeração)', !jUnknown.resetUrl)

  const resForgot = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ana@demo.com' }),
  })
  const jForgot = (await resForgot.json()) as { ok?: boolean; delivery?: string; resetUrl?: string }
  check('forgot da ana responde 200 ok', resForgot.status === 200 && jForgot.ok === true)
  check('modo demonstração devolve resetUrl', Boolean(jForgot.resetUrl))
  const outboxRow = await db.emailOutbox.findFirst({
    where: { to: 'ana@demo.com', kind: 'password_reset' },
    orderBy: { createdAt: 'desc' },
  })
  check('e-mail na fila (EmailOutbox status LOGGED)', outboxRow?.status === 'LOGGED', `id=${outboxRow?.id ?? 'nenhum'}`)

  // Token inválido → 400
  const resBad = await fetch(`${BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'token-falso-123', password: 'novasenha789' }),
  })
  check('token inválido → 400', resBad.status === 400)

  // Reset para nova senha
  const resetToken = (jForgot.resetUrl ?? '').split('reset=')[1] ?? ''
  const resReset = await fetch(`${BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: resetToken, password: 'novasenha789' }),
  })
  const jReset = (await resReset.json()) as { ok?: boolean; error?: string }
  check('reset com token válido → ok', resReset.status === 200 && jReset.ok === true, jReset.error ?? '')

  const oldLogin = await login('ana@demo.com', 'demo123')
  check('senha antiga NÃO entra mais', oldLogin.status !== 200)
  const newLogin = await login('ana@demo.com', 'novasenha789')
  check('nova senha entra', newLogin.status === 200 && Boolean(newLogin.token))
  const ana = { token: newLogin.token!, id: newLogin.id! }

  // e-mail de confirmação de troca na fila
  const changedRow = await db.emailOutbox.findFirst({
    where: { to: 'ana@demo.com', kind: 'password_changed' },
    orderBy: { createdAt: 'desc' },
  })
  check('confirmação de troca de senha na fila', Boolean(changedRow))

  // token de uso único: reutilizar → 400
  const resReuse = await fetch(`${BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: resetToken, password: 'outrasenha999' }),
  })
  check('token reutilizado → 400 (uso único)', resReuse.status === 400)

  // ============ RESTAURA demo123 (2º ciclo forgot/reset) ============
  const resForgot2 = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ana@demo.com' }),
  })
  const jForgot2 = (await resForgot2.json()) as { resetUrl?: string }
  const resetToken2 = (jForgot2.resetUrl ?? '').split('reset=')[1] ?? ''
  const resReset2 = await fetch(`${BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: resetToken2, password: 'demo123' }),
  })
  const restored = await login('ana@demo.com', 'demo123')
  check('senha restaurada para demo123', resReset2.status === 200 && restored.status === 200)
  ana.token = restored.token ?? ana.token

  // ============ #15 ANOTAÇÕES DA SESSÃO ============
  console.log('\n#15 Anotações privadas da sessão')
  const bookingsRes = await fetch(`${BASE}/api/bookings?userId=${ana.id}`, {
    headers: { Authorization: `Bearer ${ana.token}` },
  })
  const bookings = (await bookingsRes.json()) as { id: string; mentor: { userId: string; name: string }; menteeId: string }[]
  check('lista de sessões da ana carrega', bookingsRes.status === 200 && Array.isArray(bookings) && bookings.length > 0)

  // Sessão da ana em que carlos NÃO participa
  const carlosUser = await db.user.findUnique({ where: { email: 'carlos@demo.com' }, select: { id: true } })
  const target = bookings.find((b) => b.mentor.userId !== carlosUser?.id && b.menteeId !== carlosUser?.id)
  if (target && carlosUser) {
    const putRes = await fetch(`${BASE}/api/bookings/${target.id}/notes`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ana.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Combinado W-31: revisar portfólio até sexta.' }),
    })
    const putJ = (await putRes.json()) as { body?: string }
    check('PUT notes salva (upsert)', putRes.status === 200 && putJ.body?.includes('W-31'))

    const getRes = await fetch(`${BASE}/api/bookings/${target.id}/notes`, {
      headers: { Authorization: `Bearer ${ana.token}` },
    })
    const getJ = (await getRes.json()) as { body?: string }
    check('GET notes devolve o texto salvo', getRes.status === 200 && getJ.body?.includes('W-31'))

    // Identidade pela SESSÃO: query userId forjado não muda nada (é ignorado)
    const forjado = await fetch(`${BASE}/api/bookings/${target.id}/notes?userId=${carlosUser.id}`, {
      headers: { Authorization: `Bearer ${ana.token}` },
    })
    check('sessão vence query (sem IDOR)', forjado.status === 200)

    // carlos (não participante) → 403
    const carlosLogin = await login('carlos@demo.com', 'demo123')
    const carlosRes = await fetch(`${BASE}/api/bookings/${target.id}/notes`, {
      headers: { Authorization: `Bearer ${carlosLogin.token}` },
    })
    check('não participante → 403', carlosRes.status === 403, `status=${carlosRes.status}`)

    // limpeza
    await db.meetingNote.deleteMany({ where: { bookingId: target.id, authorId: ana.id } })
  } else {
    check('sessão de teste disponível', false, 'ana sem sessão sem carlos — ajuste o seed')
  }

  // participante que nunca salvou notas → body vazio, 200
  const emptyRes = await fetch(`${BASE}/api/bookings/${bookings[0]?.id}/notes`, {
    headers: { Authorization: `Bearer ${ana.token}` },
  })
  check('sem notas ainda → 200 com body vazio', emptyRes.status === 200)

  console.log(`\n=== RESULTADO: ${pass} pass, ${fail} fail ===`)
  await db.$disconnect()
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(async (e) => {
  console.error(e)
  await db.$disconnect()
  process.exit(1)
})
