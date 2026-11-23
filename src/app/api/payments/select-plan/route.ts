import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

function generateReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "OMN-";
  for (let i = 0; i < 5; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();
  if (!planId) return NextResponse.json({ error: "planId required" }, { status: 400 });

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.priceNgn === 0) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  let reference = generateReference();
  for (let i = 0; i < 10; i++) {
    const exists = await prisma.payment.findUnique({ where: { reference } });
    if (!exists) break;
    reference = generateReference();
  }

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      planId: plan.id,
      reference,
      status: "pending",
      amount: plan.priceNgn,
    },
  });

  return NextResponse.json({ ok: true, paymentId: payment.id, reference });
}
