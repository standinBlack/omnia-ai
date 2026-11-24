import { describe, it, expect } from "vitest";
import { getLocalDate, getNextResetTime } from "../timezone";

describe("timezone helpers", () => {
  it("formats Lagos local date", () => {
    const d = new Date("2026-11-19T23:30:00Z"); // ~00:30 next day in Lagos (UTC+1)
    const local = getLocalDate("Africa/Lagos", d);
    expect(local).toBe("2026-11-20");
  });

  it("returns a future reset time", () => {
    const now = new Date();
    const reset = getNextResetTime("Africa/Lagos", now);
    expect(reset.getTime()).toBeGreaterThan(now.getTime());
  });
});
