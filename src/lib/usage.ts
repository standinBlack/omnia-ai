import { prisma } from "./db";
import { getLocalDate } from "./timezone";

export async function getCurrentPlan(userId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: "active" },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  if (sub) return sub.plan;

  const free = await prisma.plan.findUnique({ where: { name: "Free" } });
  if (!free) throw new Error("Free plan not found. Run seed.");
  return free;
}

/**
 * Attempt to consume one daily video slot.
 * MongoDB note: uses a find-or-create + conditional update pattern.
 * For stricter concurrency under high load, consider a dedicated counter collection
 * with atomic findAndModify. The current approach is sufficient for the expected traffic.
 */
export async function tryConsumeUsage(userId: string, videoId: string): Promise<{
  allowed: boolean;
  remaining?: number;
  reason?: string;
  localDate: string;
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const plan = await getCurrentPlan(userId);
  const localDate = getLocalDate(user.timezone);

  return prisma.$transaction(async (tx) => {
    let daily = await tx.dailyUsage.findUnique({
      where: { userId_localDate: { userId, localDate } },
    });

    if (!daily) {
      daily = await tx.dailyUsage.create({
        data: { userId, localDate, count: 0 },
      });
    }

    if (daily.count >= plan.dailyVideos) {
      return { allowed: false, reason: "daily_limit", localDate };
    }

    await tx.dailyUsage.update({
      where: { userId_localDate: { userId, localDate } },
      data: { count: { increment: 1 } },
    });

    await tx.usageLedger.create({
      data: {
        userId,
        localDate,
        eventType: "consume",
        videoId,
      },
    });

    return { allowed: true, remaining: plan.dailyVideos - (daily.count + 1), localDate };
  });
}

export async function refundUsage(userId: string, videoId: string, localDate: string) {
  await prisma.$transaction(async (tx) => {
    await tx.dailyUsage.update({
      where: { userId_localDate: { userId, localDate } },
      data: { count: { decrement: 1 } },
    });
    await tx.usageLedger.create({
      data: {
        userId,
        localDate,
        eventType: "refund",
        videoId,
      },
    });
  });
}

export async function getUsageToday(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  const plan = await getCurrentPlan(userId);
  const localDate = getLocalDate(user.timezone);
  const daily = await prisma.dailyUsage.findUnique({
    where: { userId_localDate: { userId, localDate } },
  });
  const used = daily?.count ?? 0;
  return {
    used,
    limit: plan.dailyVideos,
    remaining: Math.max(0, plan.dailyVideos - used),
    localDate,
    planName: plan.name,
    maxLengthSeconds: plan.maxLengthSeconds,
    watermark: plan.watermark,
  };
}
