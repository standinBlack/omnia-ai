import { describe, it, expect } from "vitest";
import { generateSessionToken, hashToken } from "../auth";

describe("session tokens", () => {
  it("generates 64 hex chars (32 bytes)", () => {
    const t = generateSessionToken();
    expect(t).toMatch(/^[a-f0-9]{64}$/);
  });

  it("hashes consistently", () => {
    const t = "abc123";
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toBe(t);
  });

  it("rejects different tokens as different hashes", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });
});
