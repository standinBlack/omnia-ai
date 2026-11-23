import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return redis;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const r = getRedis();
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `rl:${key}:${Math.floor(now / windowSeconds)}`;

  const count = await r.incr(windowKey);
  if (count === 1) {
    await r.expire(windowKey, windowSeconds);
  }

  if (count > limit) {
    const ttl = await r.ttl(windowKey);
    return { allowed: false, retryAfter: ttl > 0 ? ttl : windowSeconds };
  }
  return { allowed: true };
}
