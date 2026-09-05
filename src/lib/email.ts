import { db } from '@/lib/db'

/**
 * E-mail transacional do Órbita.
 *
 * Todo e-mail passa pela fila (EmailOutbox): com SMTP configurado
 * (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM) é entregue via
 * nodemailer; sem SMTP fica registrado com status LOGGED — inspecionável no
 * painel admin (aba E-mails) e útil para demonstração/development, onde não
 * há provedor. Tal como notify(), NUNCA lança: e-mail não pode quebrar a
 * operação principal (pagamento, agendamento, reset de senha).
 */

export const SMTP_CONFIGURED = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_PORT
)

/** Template HTML com a marca Órbita (tabelas p/ compatibilidade com clientes de e-mail) */
export function brandedEmail(opts: {
  title: string
  lines: string[]
  cta?: { label: string; url: string }
  footer?: string
}): string {
  const body = opts.lines
    .map((l) => `<tr><td style="padding:0 28px 14px;font-size:15px;line-height:1.6;color:#44403c;">${l}</td></tr>`)
    .join('')
  const cta = opts.cta
    ? `<tr><td style="padding:8px 28px 24px;">
         <a href="${opts.cta.url}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 26px;border-radius:9999px;">${opts.cta.label}</a>
       </td></tr>`
    : ''
  return `<!doctype html>
<html><body style="margin:0;background:#fafaf9;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4;">
    <tr><td style="background:#047857;padding:20px 28px;">
      <span style="color:#ffffff;font-weight:800;font-size:18px;letter-spacing:-0.02em;">Mentor<span style="color:#a7f3d0;">Hub</span></span>
    </td></tr>
    <tr><td style="padding:26px 28px 6px;font-size:20px;font-weight:800;color:#1c1917;">${opts.title}</td></tr>
    ${body}
    ${cta}
    <tr><td style="padding:14px 28px 22px;font-size:12px;color:#a8a29e;border-top:1px solid #f5f5f4;">
      ${opts.footer ?? 'Você recebeu este e-mail porque tem uma conta no Órbita.'}
    </td></tr>
  </table>
</body></html>`
}

/** Envia (ou registra) um e-mail transacional. Best-effort: nunca lança. */
export async function sendEmail(input: {
  to: string
  subject: string
  kind:
    | 'password_reset'
    | 'password_changed'
    | 'order_paid'
    | 'order_refunded'
    | 'membership_expired'
    | 'booking_confirmed'
    | 'booking_completed'
    | 'booking_cancelled'
  html: string
}): Promise<void> {
  try {
    const row = await db.emailOutbox.create({
      data: {
        to: input.to,
        subject: input.subject,
        kind: input.kind,
        bodyHtml: input.html,
      },
      select: { id: true },
    })

    if (!SMTP_CONFIGURED) {
      // Sem provedor: registra como LOGGED (inspecionável no painel admin)
      await db.emailOutbox.update({
        where: { id: row.id },
        data: { status: 'LOGGED', provider: 'outbox' },
      })
      return
    }

    // SMTP configurado: entrega de verdade
    const nodemailer = await import('nodemailer')
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    })
    await transport.sendMail({
      from: process.env.SMTP_FROM || 'Órbita <no-reply@mentorhub.app>',
      to: input.to,
      subject: input.subject,
      html: input.html,
    })
    await db.emailOutbox.update({
      where: { id: row.id },
      data: { status: 'SENT', provider: 'smtp' },
    })
  } catch (err) {
    console.error('sendEmail falhou (silencioso)', err)
    try {
      // Marca a linha do outbox como FAILED (se a falha foi no envio, a row existe)
      await db.emailOutbox.updateMany({
        where: { to: input.to, kind: input.kind, status: 'PENDING' },
        data: { status: 'FAILED', error: err instanceof Error ? err.message.slice(0, 200) : 'erro desconhecido' },
      })
    } catch {
      /* nada a fazer */
    }
  }
}
