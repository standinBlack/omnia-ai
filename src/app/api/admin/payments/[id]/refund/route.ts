import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.status !== "approved") {
    return NextResponse.json({ error: "Only approved payments can be refunded" }, { status: 400 });
  }

  const free = await prisma.plan.findUnique({ where: { name: "Free" } });
  if (!free) return NextResponse.json({ error: "Free plan missing" }, { status: 500 });

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id },
      data: { status: "refunded" },
    });

    // Downgrade immediately
    await tx.subscription.updateMany({
      where: { userId: payment.userId, status: "active" },
      data: { planId: free.id, status: "expired" },
    });

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: "payment_refunded",
        targetType: "Payment",
        targetId: id,
        details: { reference: payment.reference },
      },
    });
  });

  return NextResponse.json({ ok: true, message: "Refunded and user downgraded" });
}
