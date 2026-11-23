"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [targetSeconds, setTargetSeconds] = useState(60);
  const [style, setStyle] = useState("classic");
  const [voice, setVoice] = useState("friendly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const canGenerate = wordCount >= 20 && !loading;

  async function generate() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetSeconds, style, voice }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to start generation");
      return;
    }
    router.push(`/videos/${data.videoId}`);
  }

  return (
    <main className="min-h-screen px-6 py-8 md:px-12 max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-6">Create video</h1>
      {error && <p className="text-alert-red mb-4">{error}</p>}

      <label className="block mb-6">
        Topic or notes (at least 20 words)
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="mt-1 w-full border border-soft-gray rounded-btn px-4 py-3"
          placeholder="Explain how photosynthesis works in simple terms for middle school students..."
        />
        <p className="text-sm mt-1">{wordCount} words</p>
      </label>

      <div className="mb-6">
        <p className="mb-2">Target length: {targetSeconds}s</p>
        <input
          type="range"
          min={30}
          max={240}
          value={targetSeconds}
          onChange={(e) => setTargetSeconds(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex gap-2 mt-2">
          {[30, 60, 120, 180, 240].map((s) => (
            <button key={s} type="button" onClick={() => setTargetSeconds(s)} className="px-3 py-1 bg-soft-gray rounded-btn text-sm">
              {s < 60 ? `${s}s` : `${s / 60} min`}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <label>
          Style
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="mt-1 w-full border rounded-btn px-3 py-2">
            <option value="classic">Classic whiteboard</option>
            <option value="colorful">Colorful marker</option>
            <option value="minimal">Minimal sketch</option>
          </select>
        </label>
        <label>
          Voice
          <select value={voice} onChange={(e) => setVoice(e.target.value)} className="mt-1 w-full border rounded-btn px-3 py-2">
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
          </select>
        </label>
      </div>

      <div className="p-4 bg-soft-gray/50 rounded-card mb-6">
        This will use 1 of your daily videos.
      </div>

      <button
        onClick={generate}
        disabled={!canGenerate}
        className="bg-marker-blue text-white px-6 py-3 rounded-btn font-medium disabled:opacity-50"
      >
        {loading ? "Starting..." : "Generate video"}
      </button>
    </main>
  );
}
