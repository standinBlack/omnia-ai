import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = { status: "approved" };
  if (from) where.createdAt = { gte: new Date(from) };
  if (to) where.createdAt = { ...where.createdAt, lte: new Date(to) };

  const payments = await prisma.payment.findMany({
    where,
    include: { user: { select: { email: true } }, plan: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const csv = [
    "reference,email,plan,amount,amountReceived,status,createdAt",
    ...payments.map(
      (p) =>
        `${p.reference},${p.user.email},${p.plan.name},${p.amount},${p.amountReceived || ""},${p.status},${p.createdAt.toISOString()}`
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=payments.csv",
    },
  });
}
