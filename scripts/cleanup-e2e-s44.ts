/**
 * Limpeza dos dados de E2E do app Snack criados em 2026-01-04 (S-44) no Turso.
 *
 * O teste E2E fez contra o servidor local (mesmo Turso de produção):
 *  1. Compra demo do curso "Design Systems do Zero ao Ship" (Ana) → Order + Payment.
 *  2. Enrollment de Ana em Design Systems + toggle de 1 aula (XpEvent LESSON).
 *
 * Remove (só para a Ana de demo, criados HOJE):
 *  - Orders/Payments da compra de teste (Payment cai por cascade do Order)
 *  - Enrollment de Design Systems
 *  - XpEvent LESSON da aula 1 de Design Systems + devolve o XP ao saldo
 * Imprime notificações de hoje da Ana para conferência (sem apagar — a compra
 * de demo pode ter gerado notificação para a MENTORA, que é inofensiva; apagamos
 * apenas as de enrollment/compra desta aula de teste).
 */
import { db } from "../src/lib/db";

const ANA = "cmtd0behr0000nl06u0mw0f96";
const DESIGN_SYSTEMS = "cmtd0bel3005knl06c78v8mgc";

async function main() {
  const since = new Date("2026-01-04T00:00:00Z");

  const orders = await db.order.findMany({
    where: { studentId: ANA, courseId: DESIGN_SYSTEMS, createdAt: { gte: since } },
    include: { payments: true },
  });
  console.log(`Orders de teste hoje: ${orders.length}`);
  for (const order of orders) {
    for (const p of order.payments) {
      await db.payment.delete({ where: { id: p.id } });
    }
    await db.order.delete({ where: { id: order.id } });
    console.log(`  - Order ${order.id} (${order.amount}) + ${order.payments.length} payment(s) removidos`);
  }

  const enrollments = await db.enrollment.findMany({
    where: { studentId: ANA, courseId: DESIGN_SYSTEMS },
  });
  console.log(`Enrollments de teste: ${enrollments.length}`);
  for (const e of enrollments) {
    await db.enrollment.delete({ where: { id: e.id } });
    console.log(`  - Enrollment ${e.id} removida`);
  }

  const xpEvents = await db.xpEvent.findMany({
    where: { userId: ANA, kind: "LESSON", createdAt: { gte: since } },
  });
  console.log(`XpEvents LESSON de hoje: ${xpEvents.length}`);
  let xpBack = 0;
  for (const ev of xpEvents) {
    await db.xpEvent.delete({ where: { id: ev.id } });
    xpBack += ev.amount;
    console.log(`  - XpEvent ${ev.id} (${ev.amount} XP, ref ${ev.refId}) removido`);
  }
  if (xpBack > 0) {
    await db.user.update({ where: { id: ANA }, data: { xp: { decrement: xpBack } } });
    console.log(`XP devolvido: -${xpBack}`);
  }

  const notifs = await db.notification.findMany({
    where: { userId: ANA, createdAt: { gte: since } },
  });
  console.log(`Notificações da Ana hoje (conferência): ${notifs.length}`);
  for (const n of notifs) console.log(`  - [${n.kind}] ${n.title} (ref ${n.refId ?? "-"})`);

  const mentorNotifs = await db.notification.findMany({
    where: { kind: "enrollment_new", createdAt: { gte: since }, refId: DESIGN_SYSTEMS },
  });
  console.log(`Notificações enrollment_new de Design Systems hoje: ${mentorNotifs.length}`);
  for (const n of mentorNotifs) {
    await db.notification.delete({ where: { id: n.id } });
    console.log(`  - notif ${n.id} removida`);
  }

  console.log("Limpeza concluída.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
