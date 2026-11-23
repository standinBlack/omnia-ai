"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/config";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Form = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: Form) {
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(j.error || "Login failed");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md bg-white p-8 rounded-card shadow-sm">
        <h1 className="text-2xl font-heading font-bold mb-6">Log in</h1>
        {error && <p className="text-alert-red mb-4">{error}</p>}
        <label className="block mb-4">
          Email
          <input {...register("email")} type="email" className="mt-1 w-full border border-soft-gray rounded-btn px-4 py-3" />
          {errors.email && <p className="text-alert-red text-sm mt-1">{errors.email.message}</p>}
        </label>
        <label className="block mb-6">
          Password
          <input {...register("password")} type="password" className="mt-1 w-full border border-soft-gray rounded-btn px-4 py-3" />
          {errors.password && <p className="text-alert-red text-sm mt-1">{errors.password.message}</p>}
        </label>
        <button type="submit" disabled={isSubmitting} className="w-full bg-marker-blue text-white py-3 rounded-btn font-medium">
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </main>
  );
}
