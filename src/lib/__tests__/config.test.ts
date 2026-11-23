import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkStartupConfig, isStubMode } from "../src/lib/config";

describe("startup config", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = original;
  });

  it("passes in stub mode", () => {
    process.env.STUB_MODE = "true";
    const { ok, missing } = checkStartupConfig();
    expect(ok).toBe(true);
    expect(missing.length).toBe(0);
  });

  it("fails when required vars missing in non-stub", () => {
    process.env.STUB_MODE = "false";
    delete process.env.LLM_API_KEY;
    const { ok, missing } = checkStartupConfig();
    expect(ok).toBe(false);
    expect(missing).toContain("LLM_API_KEY");
  });
});
