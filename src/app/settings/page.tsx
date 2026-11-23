"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [me, setMe] = useState<any>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/me").then(async (r) => {
      if (r.ok) setMe(await r.json());
    });
  }, []);

  async function cancelReminders() {
    const res = await fetch("/api/account/cancel-reminders", { method: "POST" });
    const data = await res.json();
    setMsg(data.message || "Done");
  }

  return (
    <main className="min-h-screen px-6 py-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-6">Account settings</h1>
      {me && (
        <div className="space-y-4">
          <p>Email: {me.email}</p>
          <p>Timezone: {me.timezone}</p>
          <p>Role: {me.onboardingRole || "Not set"}</p>
          <button onClick={cancelReminders} className="mt-4 text-sm underline text-marker-blue">
            Cancel renewal reminders
          </button>
          {msg && <p className="text-mint">{msg}</p>}
        </div>
      )}
    </main>
  );
}

