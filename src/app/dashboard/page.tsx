"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Usage {
  used: number;
  limit: number;
  remaining: number;
  planName: string;
}

interface VideoSummary {
  id: string;
  title: string | null;
  status: string;
  targetSeconds: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [videos, setVideos] = useState<VideoSummary[]>([]);

  useEffect(() => {
    fetch("/api/me").then(async (r) => {
      if (!r.ok) {
        router.push("/login");
        return;
      }
      const d = await r.json();
      setUsage(d.usage);
    });
    fetch("/api/videos").then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setVideos(d.videos);
      }
    });
  }, [router]);

  const atLimit = usage && usage.used >= usage.limit;
  const almost = usage && usage.used === usage.limit - 1;

  return (
    <main className="min-h-screen px-6 py-8 md:px-12">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/");
          }}
          className="text-sm underline"
        >
          Log out
        </button>
      </header>

      {almost && (
        <div className="mb-6 p-4 bg-marker-orange/20 rounded-card text-ink">
          1 video left today. Upgrade to get 15 videos a day.
        </div>
      )}

      <div className="mb-8 p-6 bg-white rounded-card border border-soft-gray">
        <p className="text-lg">
          {usage ? `${usage.used} of ${usage.limit} videos used today` : "Loading..."}
        </p>
        {atLimit && <p className="text-alert-red mt-2">Daily limit reached. Resets at local midnight.</p>}
      </div>

      <Link
        href="/create"
        className={`inline-block px-6 py-3 rounded-btn font-medium ${
          atLimit ? "bg-soft-gray text-ink cursor-not-allowed" : "bg-marker-blue text-white"
        }`}
        aria-disabled={Boolean(atLimit)}
      >
        {atLimit ? "Daily limit reached" : "Create new video"}
      </Link>

      <section className="mt-12">
        <h2 className="text-xl font-heading mb-4">Recent videos</h2>
        {videos.length === 0 ? (
          <p>No videos yet. Create your first one!</p>
        ) : (
          <ul className="space-y-3">
            {videos.map((v) => (
              <li key={v.id} className="p-4 bg-white rounded-card border border-soft-gray">
                {v.title || "Untitled"} — {v.status} ({v.targetSeconds}s)
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
