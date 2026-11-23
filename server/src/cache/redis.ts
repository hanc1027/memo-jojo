import { createClient } from "redis";
import { requireEnv } from "../env.ts";

const host = requireEnv("REDIS_HOST");
const port = Number(requireEnv("REDIS_PORT"));

export const genRedisKey = (memoId: number) => {
  return `memo:${memoId}`;
};

export const redis = createClient({
  socket: {
    host: host,
    port: port,
  },
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});

const DEFAULT_TTL = 300; // 秒

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis.isReady) return null; // Redis 沒連上就當作沒命中，直接去查 DB

  try {
    const raw = await redis.get(key); // key 不存在時回傳 null
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error("Redis getCache error:", err);
    return null;
  }
}

export async function setCache(
  key: string,
  value: unknown,
  ttl = DEFAULT_TTL,
): Promise<void> {
  if (!redis.isReady) return;
  try {
    await redis.set(key, JSON.stringify(value), {
      expiration: { type: "EX", value: ttl },
    });
  } catch (err) {
    console.error("Redis setCache error:", err);
  }
}

export async function delCache(...keys: string[]): Promise<void> {
  if (!redis.isReady) return;
  try {
    await redis.del(keys);
  } catch (err) {
    console.error("Redis delCache error:", err);
  }
}
