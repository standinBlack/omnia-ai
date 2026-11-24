import { prisma } from "./db";

/** Call periodically (e.g. from worker or cron). Expires subscriptions past currentPeriodEnd and moves users to Free. */
export async function expireSubscriptions() {
  const free = await prisma.plan.findUnique({ where: { name: "Free" } });
  if (!free) return;

  const now = new Date();
  const expired = await prisma.subscription.findMany({
    where: {
      status: "active",
      currentPeriodEnd: { lt: now },
    },
  });

  for (const sub of expired) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "expired", planId: free.id },
    });
  }

  return expired.length;
}

/** Stub reminder sender. In production use Resend/SMTP. */
export async function sendReminders() {
  const now = new Date();
  const in3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const subs = await prisma.subscription.findMany({
    where: {
      status: "active",
      remindersCancelled: false,
      currentPeriodEnd: { gte: now, lte: in3 },
    },
    include: { user: true, plan: true },
  });

  for (const sub of subs) {
    const days = Math.ceil(
      ((sub.currentPeriodEnd?.getTime() || 0) - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (days === 3 || days === 1) {
      console.log(
        `[email] Reminder to ${sub.user.email}: ${days} day(s) left on ${sub.plan.name}`
      );
    }
  }
}
