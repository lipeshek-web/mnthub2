// Mensagens diretas da API mobile — wrappers sobre as rotas do site
// (/api/messages): GET devolve a conversa com o par (e marca como lidas as
// recebidas), POST envia uma nova mensagem. Identidade via JWT do app.
import { NextRequest } from 'next/server'
import { GET as webMessagesGet, POST as webMessagesPost } from '@/app/api/messages/route'
import { v1Error, v1Passthrough } from '@/lib/api-v1'
import { bridgeMobileToWebRequest } from '@/lib/v1-bridge'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const bridged = await bridgeMobileToWebRequest(req)
    if (!bridged) return v1Error('Sessão inválida ou expirada.', 401)
    return await v1Passthrough(await webMessagesGet(bridged))
  } catch (err) {
    console.error('GET /api/v1/messages', err)
    return v1Error('Erro ao carregar mensagens', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    const bridged = await bridgeMobileToWebRequest(req, bodyText)
    if (!bridged) return v1Error('Sessão inválida ou expirada.', 401)
    return await v1Passthrough(await webMessagesPost(bridged))
  } catch (err) {
    console.error('POST /api/v1/messages', err)
    return v1Error('Erro ao enviar mensagem', 500)
  }
}
