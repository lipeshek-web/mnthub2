// GET /api/v1/messages/unread — contagem de mensagens não lidas (badge da aba
// Mensagens; polling leve). Wrapper da rota do site.
import { NextRequest } from 'next/server'
import { GET as webUnread } from '@/app/api/messages/unread/route'
import { v1Error, v1Passthrough } from '@/lib/api-v1'
import { bridgeMobileToWebRequest } from '@/lib/v1-bridge'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const bridged = await bridgeMobileToWebRequest(req)
    if (!bridged) return v1Error('Sessão inválida ou expirada.', 401)
    return await v1Passthrough(await webUnread(bridged))
  } catch (err) {
    console.error('GET /api/v1/messages/unread', err)
    return v1Error('Erro ao contar mensagens', 500)
  }
}
