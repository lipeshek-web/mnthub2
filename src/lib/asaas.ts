import { db } from '@/lib/db'
import crypto from 'crypto'

// ==================== GATEWAY DE PAGAMENTOS — ASAAS ====================
// Docs oficiais: https://docs.asaas.com (sandbox: https://sandbox.asaas.com)
// - Sandbox:  https://api-sandbox.asaas.com/v3
// - Produção: https://api.asaas.com/v3
// - Autenticação: header `access_token: <api key>`
// - Webhooks enviam o authToken configurado no header `asaas-access-token`

export type AsaasEnv = 'sandbox' | 'production'

export interface AsaasConfig {
  apiKey: string
  env: AsaasEnv
  webhookToken: string | null
  webhookId: string | null
}

export const ASAAS_BASE_URLS: Record<AsaasEnv, string> = {
  sandbox: 'https://api-sandbox.asaas.com/v3',
  production: 'https://api.asaas.com/v3',
}

/** Chaves de settings usadas na tabela PlatformSetting */
export const SETTING_KEYS = {
  asaasApiKey: 'asaas_api_key',
  asaasEnv: 'asaas_env',
  asaasWebhookToken: 'asaas_webhook_token',
  asaasWebhookId: 'asaas_webhook_id',
} as const

async function getSetting(key: string): Promise<string | null> {
  const row = await db.platformSetting.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.platformSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
}

export async function deleteSetting(key: string): Promise<void> {
  await db.platformSetting.deleteMany({ where: { key } })
}

/** Lê a configuração completa do Asaas (key pode vir de settings ou env) */
export async function getAsaasConfig(): Promise<AsaasConfig> {
  const [apiKeyDb, envDb, webhookToken, webhookId] = await Promise.all([
    getSetting(SETTING_KEYS.asaasApiKey),
    getSetting(SETTING_KEYS.asaasEnv),
    getSetting(SETTING_KEYS.asaasWebhookToken),
    getSetting(SETTING_KEYS.asaasWebhookId),
  ])
  const apiKey = apiKeyDb || process.env.ASAAS_API_KEY || ''
  const env: AsaasEnv = (envDb as AsaasEnv) || (process.env.ASAAS_ENV as AsaasEnv) || 'sandbox'
  return {
    apiKey,
    env: env === 'production' ? 'production' : 'sandbox',
    webhookToken,
    webhookId,
  }
}

/** true quando há chave configurada (gateway real ativo) */
export async function isAsaasEnabled(): Promise<boolean> {
  return (await getAsaasConfig()).apiKey.length > 0
}

export class AsaasError extends Error {
  status: number
  code?: string
  constructor(message: string, status = 500, code?: string) {
    super(message)
    this.name = 'AsaasError'
    this.status = status
    this.code = code
  }
}

async function asaasFetch<T>(
  config: AsaasConfig,
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const url = `${ASAAS_BASE_URLS[config.env]}${path}`
  const res = await fetch(url, {
    method: init?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: config.apiKey,
      'User-Agent': 'MentorHub/1.0',
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  if (!res.ok) {
    // Formato de erro do Asaas: { errors: [{ code, description }] }
    const errors = (json as { errors?: Array<{ code?: string; description?: string}> } | null)?.errors
    const description = errors?.[0]?.description ?? `Erro HTTP ${res.status} no Asaas`
    throw new AsaasError(description, res.status, errors?.[0]?.code)
  }
  return json as T
}

// ---------- Clientes ----------

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
}

/** Cria (ou recupera) o cliente no Asaas para o usuário da plataforma */
export async function ensureAsaasCustomer(
  config: AsaasConfig,
  user: { id: string; name: string; email: string; asaasCustomerId?: string | null; cpfCnpj?: string | null },
  cpfCnpj: string
): Promise<string> {
  if (user.asaasCustomerId) return user.asaasCustomerId
  const customer = await asaasFetch<AsaasCustomer>(config, '/customers', {
    method: 'POST',
    body: {
      name: user.name,
      email: user.email,
      cpfCnpj,
      externalReference: user.id,
      notificationDisabled: true, // comunicações ficam na plataforma, não por e-mail do Asaas
    },
  })
  await db.user.update({ where: { id: user.id }, data: { asaasCustomerId: customer.id, cpfCnpj } })
  return customer.id
}

// ---------- Cobranças ----------

export type AsaasBillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO'

export interface AsaasPayment {
  id: string
  status: string // PENDING | RECEIVED | CONFIRMED | OVERDUE | REFUNDED | CANCELED ...
  invoiceUrl: string
  value: number
  billingType: string
  externalReference?: string | null
  dueDate?: string
}

export interface PixQrCode {
  encodedImage: string
  payload: string
  expirationDate?: string
}

/** Cria uma cobrança no Asaas (externalReference = id do Order na plataforma) */
export function createAsaasPayment(
  config: AsaasConfig,
  input: {
    customerId: string
    billingType: AsaasBillingType
    value: number
    description: string
    externalReference: string
    callbackSuccessUrl?: string
  }
): Promise<AsaasPayment> {
  const dueDate = new Date()
  if (input.billingType === 'BOLETO') dueDate.setDate(dueDate.getDate() + 3)
  return asaasFetch<AsaasPayment>(config, '/payments', {
    method: 'POST',
    body: {
      customer: input.customerId,
      billingType: input.billingType,
      value: input.value,
      dueDate: dueDate.toISOString().slice(0, 10),
      description: input.description.slice(0, 500),
      externalReference: input.externalReference,
      callback: input.callbackSuccessUrl
        ? {
            successUrl: input.callbackSuccessUrl,
            pendingUrl: input.callbackSuccessUrl,
          }
        : undefined,
    },
  })
}

/** QR Code PIX (imagem base64 + copia e cola) de uma cobrança */
export function getPixQrCode(config: AsaasConfig, paymentId: string): Promise<PixQrCode> {
  return asaasFetch<PixQrCode>(config, `/payments/${paymentId}/pixQrCode`)
}

/** Recupera uma cobrança (sincronização de status) */
export function getAsaasPayment(config: AsaasConfig, paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(config, `/payments/${paymentId}`)
}

/**
 * Confirmação manual de recebimento (receiveInCash) — no sandbox serve para
 * "pagar" a cobrança de teste; em produção, para conciliação manual.
 */
export function confirmAsaasPaymentInCash(
  config: AsaasConfig,
  paymentId: string,
  value: number
): Promise<AsaasPayment> {
  const today = new Date().toISOString().slice(0, 10)
  return asaasFetch<AsaasPayment>(config, `/payments/${paymentId}/receiveInCash`, {
    method: 'POST',
    body: { paymentDate: today, value, notifyCustomer: false },
  })
}

/**
 * Estorno total da cobrança no Asaas (POST /payments/{id}/refund).
 * PIX/cartão/boleto pagos podem ser estornados integralmente.
 */
export function refundAsaasPayment(config: AsaasConfig, paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(config, `/payments/${paymentId}/refund`, {
    method: 'POST',
    body: {},
  })
}

// ---------- Webhooks ----------

/**
 * Cria o webhook de pagamentos no Asaas apontando para a plataforma.
 * O Asaas EXIGE um `email` de contato do webhook (usado para comunicações de
 * falha) — sem ele a API responde "email não pode ser vazio".
 */
export async function createPaymentWebhook(
  config: AsaasConfig,
  targetUrl: string,
  email: string
): Promise<{ id: string; token: string }> {
  // Token de 48 hex chars (>= 32, sem espaços, forte e aleatório)
  const token = crypto.randomBytes(24).toString('hex')
  const webhook = await asaasFetch<{ id: string }>(config, '/webhooks', {
    method: 'POST',
    body: {
      name: 'MentorHub — pagamentos',
      url: targetUrl,
      email,
      enabled: true,
      interrupted: false,
      apiVersion: 3,
      authToken: token,
      sendType: 'SEQUENTIALLY',
      events: [
        'PAYMENT_CREATED',
        'PAYMENT_RECEIVED',
        'PAYMENT_CONFIRMED',
        'PAYMENT_OVERDUE',
        'PAYMENT_REFUNDED',
      ],
    },
  })
  return { id: webhook.id, token }
}

/** Remove o webhook atualmente configurado (se houver) */
export async function deletePaymentWebhook(config: AsaasConfig, webhookId: string): Promise<void> {
  await asaasFetch(config, `/webhooks/${webhookId}`, { method: 'DELETE' })
}

/** Testa a conexão: GET /finance/payment/statistics exige chave válida */
export function testConnection(config: AsaasConfig): Promise<{ received: number; pending: number }> {
  return asaasFetch<{ received?: number; pending?: number }>(
    config,
    '/finance/payment/statistics'
  ).then((s) => ({ received: s.received ?? 0, pending: s.pending ?? 0 }))
}

/** Status da cobrança no Asaas → status local do Payment */
export function mapAsaasStatus(status: string): string {
  switch (status) {
    case 'RECEIVED':
    case 'RECEIVED_IN_CASH':
      return 'RECEIVED'
    case 'CONFIRMED':
      return 'CONFIRMED'
    case 'OVERDUE':
      return 'OVERDUE'
    case 'REFUNDED':
      return 'REFUNDED'
    case 'CANCELED':
      return 'CANCELED'
    default:
      return 'PENDING'
  }
}
