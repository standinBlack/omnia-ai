import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createVideoSchema } from "@/lib/config";
import { prisma } from "@/lib/db";
import { tryConsumeUsage, getCurrentPlan } from "@/lib/usage";
import { enqueueVideoJob } from "@/lib/queue";
import { rateLimit } from "@/lib/rateLimit";
import { getLocalDate } from "@/lib/timezone";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const videos = await prisma.video.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { scenes: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ videos });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`gen:${user.id}`, 10, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  const body = await req.json();
  const parsed = createVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { text, targetSeconds, style, voice } = parsed.data;
  const plan = await getCurrentPlan(user.id);
  if (targetSeconds > plan.maxLengthSeconds) {
    return NextResponse.json({ error: "Length exceeds plan maximum" }, { status: 400 });
  }

  const video = await prisma.video.create({
    data: {
      userId: user.id,
      title: text.slice(0, 80),
      status: "generating",
      targetSeconds,
      style,
      voice,
      watermark: plan.watermark,
      scenes: {
        create: [
          { order: 1, text: text.slice(0, 500) },
          { order: 2, text: "Key point explained simply." },
        ],
      },
    },
  });

  const localDate = getLocalDate(user.timezone);
  const consume = await tryConsumeUsage(user.id, video.id);
  if (!consume.allowed) {
    await prisma.video.delete({ where: { id: video.id } });
    return NextResponse.json(
      { error: "Daily limit reached", message: "Resets at local midnight" },
      { status: 429 }
    );
  }

  await enqueueVideoJob({ videoId: video.id, userId: user.id, localDate });

  return NextResponse.json({ ok: true, videoId: video.id, remaining: consume.remaining });
}
