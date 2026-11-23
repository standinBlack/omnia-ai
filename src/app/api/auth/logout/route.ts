import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("omnia_session")?.value;
  await clearSession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("omnia_session", "", { path: "/", maxAge: 0 });
  return res;
}
