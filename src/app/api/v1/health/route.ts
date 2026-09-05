import type { NextRequest } from 'next/server'
import { v1Json } from '@/lib/api-v1'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/health — batimento simples da API mobile: permite ao app (e a
 * quem mais) distinguir "servidor fora do ar" de "servidor antigo sem a rota"
 * com uma chamada pública e barata.
 */
export async function GET(_req: NextRequest) {
  return v1Json({ ok: true, service: 'mentorhub-v1', time: new Date().toISOString() })
}
