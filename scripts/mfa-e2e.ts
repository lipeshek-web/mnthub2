// Debug focado: cada verify usa ticket FRESCO (tickets são single-use)
const BASE = 'http://localhost:3000'
const EMAIL = 'gustavonv@yandex.com'
const PASS = '11223344'
const { currentTotp } = await import('../src/lib/totp')

let fails = 0
const check = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}${extra ? ` (${extra})` : ''}`)
  if (!cond) fails++
}
const post = async (path: string, body: unknown, headers: Record<string, string> = {}) => {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}
/** Login e devolve ticket MFA fresco (a conta precisa ter MFA ativo) */
const freshTicket = async () => {
  const r = await post('/api/auth/login', { email: EMAIL, password: PASS })
  if (!r.json.mfaTicket) throw new Error('login não pediu MFA: ' + JSON.stringify(r.json).slice(0, 200))
  return r.json.mfaTicket as string
}

// setup + enable
const login1 = await post('/api/auth/login', { email: EMAIL, password: PASS })
const token = login1.json.adminToken as string
const H = { 'x-admin-token': token }
const setup = await post('/api/admin/mfa', { action: 'setup' }, H)
const secret = setup.json.secret as string
const enable = await post('/api/admin/mfa', { action: 'enable', code: currentTotp(secret) }, H)
const codes: string[] = enable.json.recoveryCodes ?? []
check('enable → 10 códigos', codes.length === 10, codes[0])

// 1. TOTP errado (ticket fresco) → 401
let t = await freshTicket()
let r = await post('/api/auth/mfa/verify', { ticket: t, code: '000000' })
check('TOTP errado rejeitado', r.status === 401, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 120)}`)

// 2. Recovery code com ticket fresco → 200 + flag + 9 restantes
t = await freshTicket()
r = await post('/api/auth/mfa/verify', { ticket: t, code: codes[0] })
check('recovery aceito', r.status === 200 && r.json.usedRecoveryCode === true && r.json.recoveryCodesRemaining === 9, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`)
check('recovery → adminToken', typeof r.json.adminToken === 'string')

// 3. Reuso do mesmo código (ticket fresco) → 401
t = await freshTicket()
r = await post('/api/auth/mfa/verify', { ticket: t, code: codes[0] })
check('recovery não reutiliza', r.status === 401, `status=${r.status}`)

// 4. Ticket já consumido (reuso do ticket do passo 3) → 401 desafio expirado
r = await post('/api/auth/mfa/verify', { ticket: t, code: codes[1] })
check('ticket single-use', r.status === 401, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 120)}`)

// 5. TOTP válido (ticket fresco) → 200 sem flag
t = await freshTicket()
r = await post('/api/auth/mfa/verify', { ticket: t, code: currentTotp(secret) })
check('TOTP válido no 2º fator', r.status === 200 && r.json.usedRecoveryCode === undefined && typeof r.json.adminToken === 'string', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 160)}`)

// 6. Código do próximo lote após regeneração → aceito; antigo → rejeitado
const regen = await post('/api/admin/mfa', { action: 'regenerate-codes', password: PASS }, H)
const newCodes: string[] = regen.json.recoveryCodes ?? []
check('regenerate → 10 novos', newCodes.length === 10)
t = await freshTicket()
r = await post('/api/auth/mfa/verify', { ticket: t, code: codes[1] })
check('código do lote antigo rejeitado', r.status === 401, `status=${r.status}`)
t = await freshTicket()
r = await post('/api/auth/mfa/verify', { ticket: t, code: newCodes[0] })
check('código do lote novo aceito', r.status === 200 && r.json.recoveryCodesRemaining === 9, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 160)}`)

// 7. Desativar MFA → login simples volta a funcionar
r = await post('/api/admin/mfa', { action: 'disable', password: PASS }, H)
check('disable ok', r.status === 200 && r.json.mfaEnabled === false)
r = await post('/api/auth/login', { email: EMAIL, password: PASS })
check('login final sem MFA', r.status === 200 && !r.json.mfaRequired)

console.log(fails === 0 ? '\n>>> TODOS OS TESTES PASSARAM' : `\n>>> ${fails} FALHA(S)`)
process.exitCode = fails === 0 ? 0 : 1
export {}
