// Ponte de identidade entre a API mobile (/api/v1, JWT HS256 do mobile-auth) e
// as rotas web do site (/api/checkout, /api/messages, ...) que autenticam pelo
// token de sessão HMAC de src/lib/session.ts.
//
// O app mobile chama as rotas /api/v1/* aqui; o wrapper valida o JWT do app,
// emite um token de sessão equivalente para o MESMO usuário e reconstrói a
// requisição com o header Authorization trocado. O handler web original é
// reutilizado sem nenhuma mudança — a lógica de dinheiro/mensagens continua
// tendo UMA única implementação (sem duplicação, sem drift).
import { NextRequest } from 'next/server'
import { createSessionToken } from '@/lib/session'
import { requireMobileUser } from '@/lib/mobile-auth'

/**
 * Recria a requisição com o Authorization trocado pelo token de sessão web do
 * mesmo usuário autenticado no app. Retorna null se o JWT do app for inválido.
 *
 * `bodyText`: em POST/PATCH o stream do body só pode ser lido uma vez — o
 * wrapper lê antes (await req.text()) e repassa o texto aqui.
 */
export async function bridgeMobileToWebRequest(
  req: NextRequest,
  bodyText?: string
): Promise<NextRequest | null> {
  const user = await requireMobileUser(req)
  if (!user) return null

  const token = createSessionToken(user.id).token
  const headers = new Headers(req.headers)
  headers.set('authorization', `Bearer ${token}`)
  // Origin da URL do request — usado pelo checkout p/ montar callback do
  // gateway; o header do app (snack.expo.dev) não serve como origin da plataforma.
  headers.set('origin', req.nextUrl.origin)

  return new NextRequest(req.nextUrl.origin + req.nextUrl.pathname + req.nextUrl.search, {
    method: req.method,
    headers,
    body: bodyText !== undefined ? bodyText : undefined,
  })
}
