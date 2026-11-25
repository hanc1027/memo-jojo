import { createClient } from "redis";
import { requireEnv } from "../env.ts";

const host = requireEnv("REDIS_HOST");
const port = Number(requireEnv("REDIS_PORT"));

export const MEMO_LIST_KEY = "memos:list";

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

const DEFAULT_TTL = 300; // 秒，一般快取秒數基準值

// 用於防止「穿透」(惡意攻擊時，隨機查大量不存在的 id)
export const NOT_FOUND = "__NOT_FOUND__";
export const NOT_FOUND_TTL = 60; // 秒，比一般快取短

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

/**
 * 在 ttl 上下加一點隨機偏移，避免大量 key 同時過期
 * 例：ttl=300、ratio=0.2 → 回傳 240 ~ 360 之間的整數
 */
function withJitter(ttl: number, ratio = 0.2): number {
  // 出最大偏移量
  const range = ttl * ratio;

  // -60 ~ +60 之間的隨機數
  const offset = (Math.random() * 2 - 1) * range;

  // 上偏移、轉成整數，且至少 1 秒
  // 保險起見，如果有人傳 ttl=1 或 ratio=1，結果可能變成 0 或負數，而 Redis 不接受 0 秒的 TTL
  return Math.max(1, Math.round(ttl + offset));
}

export async function setCache(
  key: string,
  value: unknown,
  ttl = DEFAULT_TTL,
): Promise<void> {
  if (!redis.isReady) return;
  try {
    await redis.set(key, JSON.stringify(value), {
      expiration: { type: "EX", value: withJitter(ttl) },
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
