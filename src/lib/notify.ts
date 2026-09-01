import { db } from '@/lib/db'

/**
 * Cria uma notificação in-app (sino do header). Falha silenciosamente:
 * notificação nunca deve quebrar a operação principal (booking, aula, etc.).
 */
export async function notify(input: {
  userId: string
  kind:
    | 'booking_new'
    | 'booking_confirmed'
    | 'booking_cancelled'
    | 'booking_completed'
    | 'booking_paid'
    | 'order_refunded'
    | 'review_new'
    | 'lesson_new'
    | 'enrollment_new'
    | 'course_review_new'
    | 'purchase_new'
    | 'message_new'
    | 'referral_joined'
    | 'referral_rewarded'
    | 'bundle_new'
    | 'membership_new'
    | 'membership_subscribed'
    | 'membership_expired'
    | 'session_paid'
    | 'refund_requested'
    | 'refund_approved'
    | 'refund_rejected'
    | 'session_reminder'
    | 'streak_risk'
    | 'inactive_reminder'
    | 'welcome'
    | 'goal_achieved'
  title: string
  body?: string | null
  linkView?: 'dashboard' | 'course' | 'onboarding' | 'messages' | 'referrals' | null
  refId?: string | null
}): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        title: input.title.slice(0, 140),
        body: input.body ? input.body.slice(0, 300) : null,
        linkView: input.linkView ?? null,
        refId: input.refId ?? null,
      },
    })
  } catch (err) {
    console.error('notify() falhou (silencioso)', err)
  }
}

/** Formata "YYYY-MM-DDTHH:mm" como "dd/mm às HH:mm" (sem depender de helpers de UI) */
export function formatWhen(naive: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(naive)
  if (!m) return naive
  return `${m[3]}/${m[2]} às ${m[4]}:${m[5]}`
}
