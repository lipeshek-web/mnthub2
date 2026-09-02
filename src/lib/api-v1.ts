// Helpers da API v1 (mobile): respostas com CORS, URLs absolutas e paginação.
import { NextResponse, type NextRequest } from 'next/server'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

/** JSON padrão da API v1 já com headers de CORS */
export function v1Json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS })
}

/** Erro padrão { error } da API v1 */
export function v1Error(message: string, status = 400) {
  return v1Json({ error: message }, status)
}

/** Preflight CORS (roteado pelo middleware para todas as rotas /api/v1) */
export function v1Preflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

/**
 * Repassa a resposta de um handler web interno para a API v1, trocando apenas
 * os headers por CORS v1 (o corpo/status originais são preservados). Usado nos
 * wrappers que reaproveitam handlers do site (checkout, mensagens, cupons).
 */
export async function v1Passthrough(res: Response): Promise<NextResponse> {
  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/** Origin absoluta do request — respeita proxy (x-forwarded-*) para montar URLs */
export function getOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  if (host) {
    const proto = req.headers.get('x-forwarded-proto')
    const scheme = proto || (/^localhost|^127\./.test(host) ? 'http' : 'https')
    return `${scheme}://${host}`
  }
  return req.nextUrl.origin
}

/** Converte caminhos relativos do app ("/uploads/x.pdf") em URL absoluta para o mobile */
export function absolutize(url: string | null | undefined, origin: string): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${origin}${url}`
  return url
}

/** Parse seguro de arrays serializados em campos TEXT (attachments, categorias...) */
export function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
  } catch {
    // campo corrompido → trata como vazio
  }
  return []
}

/** Parâmetros de paginação (page/pageSize) com limites defensivos */
export function pageParams(req: NextRequest, defaultSize = 20) {
  const sp = req.nextUrl.searchParams
  const page = Math.max(1, Math.trunc(Number(sp.get('page')) || 1))
  const pageSize = Math.min(50, Math.max(1, Math.trunc(Number(sp.get('pageSize')) || defaultSize)))
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

/** Nota média (1 casa) a partir de uma lista de ratings */
export function avgRating(ratings: { rating: number }[]): number {
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}
