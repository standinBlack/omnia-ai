"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  dailyVideos: number;
  maxLengthSeconds: number;
  priceNgn: number;
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/plans").then(async (r) => {
      if (r.ok) setPlans(await r.json());
    });
  }, []);

  async function selectPlan(planId: string) {
    setLoading(true);
    const res = await fetch("/api/payments/select-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push(`/checkout/${data.paymentId}`);
    } else {
      alert(data.error || "Failed");
    }
  }

  const paid = plans.filter((p) => p.priceNgn > 0);

  return (
    <main className="min-h-screen px-6 py-8 md:px-12 max-w-4xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-6">Plans and billing</h1>
      <p className="mb-8">Pay by bank transfer. No automatic renewal.</p>
      <div className="grid md:grid-cols-2 gap-6">
        {paid.map((p) => (
          <div
            key={p.id}
            className={`p-6 bg-white rounded-card border ${p.name === "Pro" ? "border-2 border-marker-orange" : ""}`}
          >
            <h2 className="font-heading text-xl">{p.name}{p.name === "Pro" ? " (recommended)" : ""}</h2>
            <p className="text-2xl font-bold my-2">₦{p.priceNgn.toLocaleString()}</p>
            <p>{p.dailyVideos} videos/day · {Math.round(p.maxLengthSeconds / 60)} min max</p>
            <button
              disabled={loading}
              onClick={() => selectPlan(p.id)}
              className="mt-4 bg-marker-blue text-white px-4 py-2 rounded-btn"
            >
              Choose {p.name}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
