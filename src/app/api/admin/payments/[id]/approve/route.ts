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
  const body = await req.json();
  const { amountReceived, note, action } = body; // action: "approve" | "approve_at_received"

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { plan: true },
  });
  if (!payment || payment.status !== "pending") {
    return NextResponse.json({ error: "Invalid or already processed payment" }, { status: 400 });
  }

  if (amountReceived == null || typeof amountReceived !== "number") {
    return NextResponse.json({ error: "amountReceived is required" }, { status: 400 });
  }

  if (amountReceived !== payment.amount && !note) {
    return NextResponse.json(
      { error: "Note required when amount received differs from plan price" },
      { status: 400 }
    );
  }

  if (amountReceived !== payment.amount && action !== "approve_at_received") {
    return NextResponse.json(
      { error: 'Choose "Approve at amount received" or reject' },
      { status: 400 }
    );
  }

  // Approve
  const now = new Date();
  let periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const existingSub = await prisma.subscription.findFirst({
    where: { userId: payment.userId, status: "active" },
    orderBy: { currentPeriodEnd: "desc" },
  });

  if (existingSub?.currentPeriodEnd && existingSub.currentPeriodEnd > now) {
    periodEnd = new Date(existingSub.currentPeriodEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id },
      data: {
        status: "approved",
        amountReceived,
        adminNote: note || null,
      },
    });

    if (existingSub) {
      await tx.subscription.update({
        where: { id: existingSub.id },
        data: {
          planId: payment.planId,
          status: "active",
          currentPeriodEnd: periodEnd,
        },
      });
    } else {
      await tx.subscription.create({
        data: {
          userId: payment.userId,
          planId: payment.planId,
          status: "active",
          currentPeriodEnd: periodEnd,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: "payment_approved",
        targetType: "Payment",
        targetId: id,
        details: { amountReceived, note, reference: payment.reference },
      },
    });
  });

  return NextResponse.json({ ok: true, message: "Payment approved and plan activated" });
}
