import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  const pending = await prisma.payment.findMany({
    where: { status: "pending" },
    include: { user: { select: { email: true } }, plan: { select: { name: true } } },
  });

  return NextResponse.json({ users, pendingPayments: pending });
}
