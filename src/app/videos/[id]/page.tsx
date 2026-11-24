"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface VideoDetails {
  id: string;
  title: string | null;
  status: string;
  outputKey: string | null;
  scenes: { id: string; text: string }[];
}

export default function VideoPage() {
  const params = useParams<{ id: string }>();
  const [video, setVideo] = useState<VideoDetails | null>(null);

  useEffect(() => {
    const id = params.id;
    const poll = async () => {
      const res = await fetch(`/api/videos`);
      if (res.ok) {
        const data: { videos: VideoDetails[] } = await res.json();
        const v = data.videos.find((x) => x.id === id);
        setVideo(v ?? null);
        if (v && (v.status === "generating" || v.status === "draft")) {
          setTimeout(poll, 2000);
        }
      }
    };
    poll();
  }, [params.id]);

  if (!video) return <main className="p-8">Loading...</main>;

  return (
    <main className="min-h-screen px-6 py-8 md:px-12 max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-4">{video.title}</h1>
      <p className="mb-4">Status: {video.status}</p>
      {video.status === "ready" && video.outputKey && (
        <div>
          <p className="text-mint mb-2">Video ready!</p>
          <a href={`/api/files/${encodeURIComponent(video.outputKey)}`} className="text-marker-blue underline">
            Download MP4
          </a>
        </div>
      )}
      {video.status === "failed" && (
        <p className="text-alert-red">This attempt did not use a daily video. You can try again.</p>
      )}
      <div className="mt-8">
        <h2 className="font-heading text-xl mb-2">Scenes</h2>
        <ul className="space-y-2">
          {video.scenes.map((s) => (
            <li key={s.id} className="p-3 bg-white rounded-card border">{s.text}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
