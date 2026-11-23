"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CheckoutPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    fetch(`/api/payments/${id}`).then(async (r) => {
      if (r.ok) setData(await r.json());
    });
  }, [params.id]);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/payments/${params.id}`, {
      method: "POST",
      body: form,
    });
    const json = await res.json();
    setUploading(false);
    setMessage(json.message || json.error || "Done");
  }

  if (!data) return <main className="p-8">Loading checkout...</main>;

  return (
    <main className="min-h-screen px-6 py-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-4">Complete your payment</h1>
      <div className="p-6 bg-white rounded-card border mb-6">
        <p><strong>Plan:</strong> {data.payment.planName}</p>
        <p><strong>Amount:</strong> ₦{data.payment.amount.toLocaleString()}</p>
        <p><strong>Reference:</strong> {data.payment.reference}</p>
        <p className="mt-4 text-marker-orange font-medium">
          Include your reference in the transfer narration.
        </p>
        <hr className="my-4 border-soft-gray" />
        <p><strong>Account name:</strong> {data.bank.accountName}</p>
        <p><strong>Account number:</strong> {data.bank.accountNumber}</p>
        <p><strong>Bank:</strong> {data.bank.bankName}</p>
      </div>

      {data.payment.status === "pending" && !message && (
        <form onSubmit={upload} className="space-y-4">
          <label className="block">
            Receipt (image or PDF, max 5 MB)
            <input name="receipt" type="file" accept="image/*,.pdf" required className="mt-1 block" />
          </label>
          <label className="block">
            Sender name (optional)
            <input name="senderName" className="mt-1 w-full border rounded-btn px-3 py-2" />
          </label>
          <label className="block">
            Transfer date (optional)
            <input name="transferDate" type="date" className="mt-1 w-full border rounded-btn px-3 py-2" />
          </label>
          <button type="submit" disabled={uploading} className="bg-marker-blue text-white px-6 py-3 rounded-btn">
            {uploading ? "Uploading..." : "Submit receipt"}
          </button>
        </form>
      )}

      {message && (
        <p className="mt-6 p-4 bg-mint/20 rounded-card">{message}</p>
      )}
    </main>
  );
}
