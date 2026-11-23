import "dotenv/config";

const BASE = process.env.APP_URL || "http://localhost:3000";

async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (e) {
    console.log(`FAIL ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

async function main() {
  let cookie = "";

  await step("signup", async () => {
    const res = await fetch(`${BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `smoke-${Date.now()}@example.com`,
        password: "password123",
        onboardingRole: "Teacher",
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) throw new Error("No cookie");
    cookie = setCookie.split(";")[0];
  });

  await step("login", async () => {
    // already logged in from signup; verify me
    const res = await fetch(`${BASE}/api/me`, { headers: { Cookie: cookie } });
    if (!res.ok) throw new Error(await res.text());
  });

  await step("GET /api/me", async () => {
    const res = await fetch(`${BASE}/api/me`, { headers: { Cookie: cookie } });
    if (!res.ok) throw new Error("me failed");
    const data = await res.json();
    if (!data.email) throw new Error("no email");
  });

  await step("logout", async () => {
    const res = await fetch(`${BASE}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    if (!res.ok) throw new Error("logout failed");
  });

  console.log(process.exitCode ? "SMOKE FAILED" : "SMOKE PASSED");
}

main();
