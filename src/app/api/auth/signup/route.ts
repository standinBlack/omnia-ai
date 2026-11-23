import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/config";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = await rateLimit(`signup:${ip}`, 5, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password, onboardingRole } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      onboardingRole,
      timezone: process.env.DEFAULT_TIMEZONE || "Africa/Lagos",
    },
  });

  // Give Free plan subscription
  const free = await prisma.plan.findUnique({ where: { name: "Free" } });
  if (free) {
    await prisma.subscription.create({
      data: { userId: user.id, planId: free.id, status: "active" },
    });
  }

  const token = await createSession(user.id);
  const res = NextResponse.json({ ok: true, userId: user.id });
  setSessionCookie(res, token);
  return res;
}
