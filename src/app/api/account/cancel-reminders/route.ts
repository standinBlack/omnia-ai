import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.subscription.updateMany({
    where: { userId: user.id, status: "active" },
    data: { remindersCancelled: true },
  });

  return NextResponse.json({
    ok: true,
    message: "Reminders cancelled. Access continues until the end of your current period.",
  });
}
