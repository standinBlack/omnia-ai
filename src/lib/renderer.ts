import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { getStorage } from "./storage";

export interface SceneInput {
  text: string;
  order: number;
}

export interface RenderOptions {
  scenes: SceneInput[];
  style: string;
  voice: string;
  watermark: boolean;
  targetSeconds: number;
  outputKey: string;
}

export interface VideoRenderer {
  render(opts: RenderOptions): Promise<{ key: string; duration: number }>;
}

class CanvasWhiteboardRenderer implements VideoRenderer {
  async render(opts: RenderOptions): Promise<{ key: string; duration: number }> {
    const storage = getStorage();
    const tmpDir = path.join("/tmp", `omnia-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });

    // For MVP: generate a short MP4 with FFmpeg using color background + drawtext
    // Real canvas frame capture would be more complex; this is swappable.
    const duration = Math.min(opts.targetSeconds, 30); // cap for demo
    const outFile = path.join(tmpDir, "out.mp4");

    const watermarkText = opts.watermark ? "Omnia AI" : "";
    const mainText = opts.scenes.map((s) => s.text).join(" | ").slice(0, 200) || "Omnia AI explainer";

    await new Promise<void>((resolve, reject) => {
      const args = [
        "-y",
        "-f", "lavfi",
        "-i", `color=c=#FBFAF7:s=1280x720:d=${duration}`,
        "-vf",
        `drawtext=text='${mainText.replace(/'/g, "")}':fontcolor=#1F2430:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2` +
          (watermarkText ? `,drawtext=text='${watermarkText}':fontcolor=#F5843B:fontsize=24:x=20:y=h-40` : ""),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-t", String(duration),
        outFile,
      ];
      const proc = spawn("ffmpeg", args, { stdio: "pipe" });
      proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
      proc.on("error", reject);
    });

    const buffer = await fs.readFile(outFile);
    await storage.put(opts.outputKey, buffer, "video/mp4");
    await fs.rm(tmpDir, { recursive: true, force: true });

    return { key: opts.outputKey, duration };
  }
}

export function getRenderer(): VideoRenderer {
  return new CanvasWhiteboardRenderer();
}
