import { Queue, Worker, Job } from "bullmq";
import { getRedis } from "./rateLimit";
import { prisma } from "./db";
import { getRenderer } from "./renderer";
import { refundUsage } from "./usage";
import { isStubMode } from "./config";

export const videoQueue = new Queue("video-generation", {
  connection: getRedis(),
});

export interface VideoJobData {
  videoId: string;
  userId: string;
  localDate: string;
}

export async function enqueueVideoJob(data: VideoJobData) {
  await videoQueue.add("generate", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}

export function startWorker() {
  const worker = new Worker<VideoJobData>(
    "video-generation",
    async (job: Job<VideoJobData>) => {
      const { videoId, userId, localDate } = job.data;

      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: { scenes: { orderBy: { order: "asc" } } },
      });
      if (!video) throw new Error("Video not found");

      try {
        await prisma.videoJob.create({
          data: { videoId, stage: "script", attempts: job.attemptsMade + 1 },
        });

        // Stub stages
        if (isStubMode()) {
          await new Promise((r) => setTimeout(r, 500));
        }

        await prisma.videoJob.updateMany({
          where: { videoId, stage: "script" },
          data: { stage: "scenes" },
        });

        await prisma.videoJob.updateMany({
          where: { videoId, stage: "scenes" },
          data: { stage: "voice" },
        });

        await prisma.videoJob.updateMany({
          where: { videoId, stage: "voice" },
          data: { stage: "render" },
        });

        const outputKey = `videos/${userId}/${videoId}.mp4`;
        const renderer = getRenderer();
        const result = await renderer.render({
          scenes: video.scenes.map((s) => ({ text: s.text, order: s.order })),
          style: video.style,
          voice: video.voice,
          watermark: video.watermark,
          targetSeconds: video.targetSeconds,
          outputKey,
        });

        await prisma.video.update({
          where: { id: videoId },
          data: { status: "ready", outputKey: result.key },
        });

        await prisma.videoJob.updateMany({
          where: { videoId },
          data: { stage: "done" },
        });
      } catch (err) {
        console.error("Job failed", err);
        await prisma.video.update({
          where: { id: videoId },
          data: { status: "failed" },
        });
        await prisma.videoJob.updateMany({
          where: { videoId },
          data: { stage: "failed", error: String(err) },
        });
        // Refund the slot
        await refundUsage(userId, videoId, localDate);
        throw err;
      }
    },
    { connection: getRedis(), concurrency: 2 }
  );

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
}
