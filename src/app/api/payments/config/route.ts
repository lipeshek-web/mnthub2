import { NextResponse } from 'next/server'
import { getAsaasConfig } from '@/lib/asaas'

export const dynamic = 'force-dynamic'

/** GET /api/payments/config — informa ao frontend qual fluxo de checkout usar */
export async function GET() {
  const config = await getAsaasConfig()
  const active = config.apiKey.length > 0
  return NextResponse.json({
    gateway: active ? 'ASAAS' : 'SIMULADO',
    env: active ? config.env : null,
  })
}
