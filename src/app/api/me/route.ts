import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUsageToday } from "@/lib/usage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const usage = await getUsageToday(user.id);
  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
    timezone: user.timezone,
    onboardingRole: user.onboardingRole,
    usage,
  });
}
