import { NextResponse } from "next/server";
import { checkStartupConfig } from "@/lib/config";

export async function GET() {
  const { ok, missing } = checkStartupConfig();
  if (!ok) {
    return NextResponse.json(
      { error: "Configuration incomplete", missing },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
