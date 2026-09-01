import { NextResponse, type NextRequest } from 'next/server'

// Preflight CORS para a API mobile (/api/v1). As respostas normais já saem
// com os headers de CORS (src/lib/api-v1.ts) — aqui só tratamos o OPTIONS
// que o browser/Expo web dispara antes de POST/PATCH.
export function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/v1/:path*',
}
