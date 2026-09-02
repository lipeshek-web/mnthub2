// POST /api/v1/coupons/validate — wrapper da API mobile sobre
// /api/coupons/validate do site (validação de cupom antes do checkout).
import { NextRequest } from 'next/server'
import { POST as webCouponValidate } from '@/app/api/coupons/validate/route'
import { v1Error, v1Passthrough } from '@/lib/api-v1'
import { bridgeMobileToWebRequest } from '@/lib/v1-bridge'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    const bridged = await bridgeMobileToWebRequest(req, bodyText)
    if (!bridged) return v1Error('Sessão inválida ou expirada.', 401)
    return await v1Passthrough(await webCouponValidate(bridged))
  } catch (err) {
    console.error('POST /api/v1/coupons/validate', err)
    return v1Error('Erro ao validar cupom', 500)
  }
}
