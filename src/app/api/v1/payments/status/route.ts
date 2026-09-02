// GET /api/v1/payments/status?paymentId= — wrapper da API mobile sobre
// /api/payments/status do site (consulta + sincronização de cobrança Asaas).
import { NextRequest } from 'next/server'
import { GET as webPaymentStatus } from '@/app/api/payments/status/route'
import { v1Error, v1Passthrough } from '@/lib/api-v1'
import { bridgeMobileToWebRequest } from '@/lib/v1-bridge'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const bridged = await bridgeMobileToWebRequest(req)
    if (!bridged) return v1Error('Sessão inválida ou expirada.', 401)
    return await v1Passthrough(await webPaymentStatus(bridged))
  } catch (err) {
    console.error('GET /api/v1/payments/status', err)
    return v1Error('Erro ao consultar o pagamento.', 500)
  }
}
