import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { plan: true },
  });
  if (!payment || payment.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const settings = await prisma.adminSettings.findUnique({ where: { key: "default" } });

  return NextResponse.json({
    payment: {
      id: payment.id,
      reference: payment.reference,
      amount: payment.amount,
      status: payment.status,
      planName: payment.plan.name,
    },
    bank: {
      accountName: settings?.accountName || "REPLACE_ME",
      accountNumber: settings?.accountNumber || "REPLACE_ME",
      bankName: settings?.bankName || "REPLACE_ME",
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.userId !== user.id || payment.status !== "pending") {
    return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("receipt") as File | null;
  const senderName = form.get("senderName") as string | null;
  const transferDate = form.get("transferDate") as string | null;

  if (!file || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Receipt required, max 5 MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `receipts/${user.id}/${payment.reference}-${Date.now()}.${file.name.split(".").pop() || "bin"}`;
  const storage = getStorage();
  await storage.put(key, buffer, file.type);

  await prisma.payment.update({
    where: { id },
    data: {
      receiptKey: key,
      senderName: senderName || null,
      transferDate: transferDate ? new Date(transferDate) : null,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Payment under review, usually within 24 hours.",
  });
}
