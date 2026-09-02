// GET /api/v1/messages/threads — caixa de entrada do app: uma linha por
// conversa, com última mensagem e contagem de não lidas (wrapper do site).
import { NextRequest } from 'next/server'
import { GET as webThreads } from '@/app/api/messages/threads/route'
import { v1Error, v1Passthrough } from '@/lib/api-v1'
import { bridgeMobileToWebRequest } from '@/lib/v1-bridge'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const bridged = await bridgeMobileToWebRequest(req)
    if (!bridged) return v1Error('Sessão inválida ou expirada.', 401)
    return await v1Passthrough(await webThreads(bridged))
  } catch (err) {
    console.error('GET /api/v1/messages/threads', err)
    return v1Error('Erro ao carregar conversas', 500)
  }
}
