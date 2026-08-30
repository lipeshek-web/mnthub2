import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { audit, requireAdmin } from '@/lib/admin-auth'
import {
  getAsaasConfig,
  setSetting,
  deleteSetting,
  testConnection,
  createPaymentWebhook,
  deletePaymentWebhook,
  SETTING_KEYS,
  type AsaasEnv,
} from '@/lib/asaas'

export const dynamic = 'force-dynamic'

// ==================== CONFIGURAÇÃO DO GATEWAY (ASAAS) ====================
// GET: estado atual (chave mascarada) · PUT: salvar chave/ambiente
// POST action=test: valida a chave no Asaas
// POST action=webhook: cria o webhook de pagamentos no Asaas
// DELETE: remove a configuração (volta ao modo demonstração)

function maskKey(key: string): string {
  if (!key) return ''
  if (key.length <= 8) return '••••'
  return `${key.slice(0, 4)}…${key.slice(-4)}`
}

async function publicState() {
  const config = await getAsaasConfig()
  return {
    configured: config.apiKey.length > 0,
    env: config.env,
    maskedKey: maskKey(config.apiKey),
    webhookConfigured: Boolean(config.webhookToken && config.webhookId),
  }
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error
  return NextResponse.json({ asaas: await publicState() })
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error
  const { actor } = guard

  try {
    const body = await req.json().catch(() => ({}))
    const apiKey = String(body?.apiKey ?? '').trim()
    const env = (String(body?.env ?? 'sandbox') === 'production' ? 'production' : 'sandbox') as AsaasEnv

    if (apiKey && apiKey.length < 16) {
      return NextResponse.json({ error: 'A chave da API parece curta demais.' }, { status: 400 })
    }

    await setSetting(SETTING_KEYS.asaasEnv, env)
    if (apiKey) {
      await setSetting(SETTING_KEYS.asaasApiKey, apiKey)
      // Ambiente trocou? As credenciais de sandbox e produção são independentes:
      // ao trocar o ambiente, limpa webhook/token antigos (pertencem à outra conta).
      const before = await getAsaasConfig()
      if (before.webhookId && before.env !== env) {
        await deleteSetting(SETTING_KEYS.asaasWebhookToken).catch(() => {})
        await deleteSetting(SETTING_KEYS.asaasWebhookId).catch(() => {})
      }
    } else {
      // apiKey vazia explicitamente = remover a chave (modo demonstração)
      await deleteSetting(SETTING_KEYS.asaasApiKey)
      await deleteSetting(SETTING_KEYS.asaasWebhookToken).catch(() => {})
      await deleteSetting(SETTING_KEYS.asaasWebhookId).catch(() => {})
    }

    await audit(actor, 'asaas.settings_update', { env, keySet: Boolean(apiKey) })
    return NextResponse.json({ asaas: await publicState() })
  } catch (err) {
    console.error('PUT /api/admin/settings', err)
    return NextResponse.json({ error: 'Erro ao salvar a configuração.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error
  const { actor } = guard

  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action ?? '')
    const config = await getAsaasConfig()

    if (!config.apiKey) {
      return NextResponse.json({ error: 'Configure a chave da API primeiro.' }, { status: 400 })
    }

    if (action === 'test') {
      try {
        const stats = await testConnection(config)
        await audit(actor, 'asaas.test_ok', { env: config.env })
        return NextResponse.json({ ok: true, env: config.env, stats })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha na conexão.'
        await audit(actor, 'asaas.test_fail', { env: config.env, message })
        return NextResponse.json({ ok: false, error: message }, { status: 502 })
      }
    }

    if (action === 'webhook') {
      // URL pública que o Asaas vai chamar (em localhost o webhook só funcionará
      // em produção; localmente use "Verificar status"/confirmação manual)
      const rawUrl = String(body?.url ?? '').trim()
      if (!/^https?:\/\/.+/i.test(rawUrl)) {
        return NextResponse.json({ error: 'Informe a URL pública do webhook (https://…).' }, { status: 400 })
      }
      try {
        // Substitui o webhook anterior (máx. 10 por conta no Asaas)
        if (config.webhookId) {
          await deletePaymentWebhook(config, config.webhookId).catch(() => {})
        }
        const { id, token } = await createPaymentWebhook(config, rawUrl)
        await setSetting(SETTING_KEYS.asaasWebhookId, id)
        await setSetting(SETTING_KEYS.asaasWebhookToken, token)
        await audit(actor, 'asaas.webhook_created', { url: rawUrl, env: config.env })
        return NextResponse.json({ ok: true, asaas: await publicState() })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao criar o webhook.'
        return NextResponse.json({ ok: false, error: message }, { status: 502 })
      }
    }

    return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 })
  } catch (err) {
    console.error('POST /api/admin/settings', err)
    return NextResponse.json({ error: 'Erro na operação.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error
  const { actor } = guard

  try {
    const config = await getAsaasConfig()
    if (config.webhookId) {
      await deletePaymentWebhook(config, config.webhookId).catch(() => {})
    }
    await db.platformSetting.deleteMany({
      where: { key: { in: Object.values(SETTING_KEYS) } },
    })
    await audit(actor, 'asaas.settings_removed')
    return NextResponse.json({ asaas: await publicState() })
  } catch (err) {
    console.error('DELETE /api/admin/settings', err)
    return NextResponse.json({ error: 'Erro ao remover a configuração.' }, { status: 500 })
  }
}
