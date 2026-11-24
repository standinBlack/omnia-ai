import { z } from "zod";

export function isStubMode(): boolean {
  return process.env.STUB_MODE === "true";
}

export function getRequiredEnvVars(): string[] {
  const required = [
    "DATABASE_URL",
    "REDIS_URL",
    "SESSION_SECRET",
    "APP_URL",
  ];

  if (process.env.NODE_ENV === "production") {
    required.push(
      "S3_ENDPOINT",
      "S3_BUCKET",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY"
    );
  }

  return required;
}

export function checkStartupConfig(): { ok: boolean; missing: string[] } {
  const required = getRequiredEnvVars();
  const missing = required.filter((k) => !process.env[k] || process.env[k]!.trim() === "");
  if (!isStubMode()) {
    missing.push("STUB_MODE=true (live LLM/TTS integrations are not implemented)");
  }
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    missing.push("SESSION_SECRET (must be >= 32 chars)");
  }
  return { ok: missing.length === 0, missing };
}

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  onboardingRole: z.enum(["Teacher", "Trainer", "Business owner", "Marketer", "Other"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createVideoSchema = z.object({
  text: z.string().min(20),
  targetSeconds: z.number().int().min(30).max(17 * 60),
  style: z.enum(["classic", "colorful", "minimal"]),
  voice: z.enum(["friendly", "professional"]),
});
