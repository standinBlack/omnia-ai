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
  const { reason } = await req.json();
  if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
    return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.status !== "pending") {
    return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id },
      data: { status: "rejected", rejectionReason: reason.trim() },
    });
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: "payment_rejected",
        targetType: "Payment",
        targetId: id,
        details: { reason, reference: payment.reference },
      },
    });
  });

  return NextResponse.json({ ok: true });
}
