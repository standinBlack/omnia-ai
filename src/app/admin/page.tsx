"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/overview").then(async (r) => {
      if (!r.ok) {
        setError("Admin access required");
        return;
      }
      setData(await r.json());
    });
    fetch("/api/admin/payments").then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setPayments(d.payments || []);
      }
    });
  }, []);

  async function approve(id: string, amount: number, note?: string) {
    const action = note ? "approve_at_received" : "approve";
    await fetch(`/api/admin/payments/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountReceived: amount, note, action }),
    });
    location.reload();
  }

  async function reject(id: string) {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    await fetch(`/api/admin/payments/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    location.reload();
  }

  if (error) return <main className="p-8">{error}</main>;
  if (!data) return <main className="p-8">Loading admin...</main>;

  return (
    <main className="min-h-screen px-6 py-8">
      <h1 className="text-2xl font-heading font-bold mb-6">Admin panel</h1>

      <section className="mb-10">
        <h2 className="text-xl font-heading mb-2">Pending payments</h2>
        {payments.length === 0 ? (
          <p>None</p>
        ) : (
          <ul className="space-y-4">
            {payments.map((p) => (
              <li key={p.id} className="p-4 bg-white rounded-card border">
                <p>
                  {p.reference} · {p.user.email} · ₦{p.amount} · {p.plan.name}
                </p>
                <p className="text-sm">
                  Sender: {p.senderName || "—"} · Date:{" "}
                  {p.transferDate ? new Date(p.transferDate).toLocaleDateString() : "—"}
                </p>
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => approve(p.id, p.amount)}
                    className="bg-mint text-white px-3 py-1 rounded-btn text-sm"
                  >
                    Approve exact
                  </button>
                  <button
                    onClick={() => reject(p.id)}
                    className="bg-alert-red text-white px-3 py-1 rounded-btn text-sm"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-heading mb-2">Users</h2>
        <ul className="space-y-1">
          {data.users?.map((u: any) => (
            <li key={u.id}>{u.email} ({u.role})</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
