import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkStartupConfig, getRequiredEnvVars } from "../config";

describe("startup config", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = original;
  });

  it("still requires infrastructure in stub mode", () => {
    process.env.STUB_MODE = "true";
    process.env.NODE_ENV = "development";
    expect(getRequiredEnvVars()).toEqual([
      "DATABASE_URL",
      "REDIS_URL",
      "SESSION_SECRET",
      "APP_URL",
    ]);
  });

  it("requires persistent object storage in production", () => {
    process.env.STUB_MODE = "true";
    process.env.NODE_ENV = "production";
    expect(getRequiredEnvVars()).toContain("S3_SECRET_ACCESS_KEY");
    expect(checkStartupConfig().missing).toContain("S3_BUCKET");
  });

  it("fails when required vars missing in non-stub", () => {
    process.env.STUB_MODE = "false";
    delete process.env.LLM_API_KEY;
    const { ok, missing } = checkStartupConfig();
    expect(ok).toBe(false);
    expect(missing).toContain(
      "STUB_MODE=true (live LLM/TTS integrations are not implemented)"
    );
  });
});
