import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const settings = await prisma.adminSettings.findUnique({ where: { key: "default" } });
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const settings = await prisma.adminSettings.update({
    where: { key: "default" },
    data: {
      bankName: body.bankName,
      accountName: body.accountName,
      accountNumber: body.accountNumber,
      supportEmail: body.supportEmail,
    },
  });
  return NextResponse.json(settings);
}
