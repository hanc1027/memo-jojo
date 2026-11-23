import { createClient } from "redis";
import { requireEnv } from "../env.ts";

const host = requireEnv("REDIS_HOST");
const port = Number(requireEnv("REDIS_PORT"));

export const redis = createClient({
  socket: {
    host: host,
    port: port,
  },
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});


export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis.isReady) return null;  // Redis 沒連上就當作沒命中，直接去查 DB

  try {
    const raw = await redis.get(key);  // key 不存在時回傳 null
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error("Redis getCache error:", err);
    return null;
  }
}
