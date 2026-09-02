// POST /api/v1/checkout — wrapper da API mobile sobre o checkout do site
// (src/app/api/checkout/route.ts): mesma lógica de pedido/cobrança (Asaas ou
// modo demonstração), autenticada pelo JWT do app via ponte de identidade.
import { NextRequest } from 'next/server'
import { POST as webCheckout } from '@/app/api/checkout/route'
import { v1Error, v1Passthrough } from '@/lib/api-v1'
import { bridgeMobileToWebRequest } from '@/lib/v1-bridge'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    const bridged = await bridgeMobileToWebRequest(req, bodyText)
    if (!bridged) return v1Error('Sessão inválida ou expirada.', 401)
    return await v1Passthrough(await webCheckout(bridged))
  } catch (err) {
    console.error('POST /api/v1/checkout', err)
    return v1Error('Erro ao processar o checkout.', 500)
  }
}
