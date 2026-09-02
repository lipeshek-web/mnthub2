// GET /api/v1/payments/config — informa ao app qual fluxo de checkout usar
// (gateway Asaas real ou modo demonstração). Público, sem segredos.
import { getAsaasConfig } from '@/lib/asaas'
import { v1Json } from '@/lib/api-v1'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = await getAsaasConfig()
    const active = config.apiKey.length > 0
    return v1Json({
      gateway: active ? 'ASAAS' : 'SIMULADO',
      env: active ? config.env : null,
    })
  } catch (err) {
    console.error('GET /api/v1/payments/config', err)
    return v1Json({ gateway: 'SIMULADO', env: null })
  }
}
