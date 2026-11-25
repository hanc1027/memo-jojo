import {
  acquireLock,
  genRedisKey,
  getCache,
  NOT_FOUND,
  NOT_FOUND_TTL,
  releaseLock,
  setCache,
  sleep,
} from "../cache/redis.ts";
import { pool } from "../db/pool.ts";
import { notFoundError } from "../errors/app-error.ts";
import { toMemo, type Memo, type MemoRow } from "./shared.ts";

const RETRY_TIMES = 10;
const RETRY_DELAY_MS = 50;

/**
 * 讀快取：命中就回傳 Memo、快取了不存在就丟 404、沒有快取就回傳 null
 */
async function readCache(key: string): Promise<Memo | null> {
  const cached = await getCache<Memo | typeof NOT_FOUND>(key);
  if (cached === NOT_FOUND) throw notFoundError();
  return cached;
}

export async function getMemo(id: number): Promise<Memo> {
  const key = genRedisKey(id);

  // 1. 先查 Redis 快取
  const cached = await readCache(key);
  if (cached) {
    console.log("cache HIT", key);
    return cached;
  }
  console.log("cache MISS", key);

  // 2. 搶鎖
  const lockKey = `lock:${key}`;
  const token = await acquireLock(lockKey);

  // 4. 沒搶到鎖 → 等別人查完，重試讀快取
  if (token === null) {
    for (let i = 0; i < RETRY_TIMES; i++) {
      await sleep(RETRY_DELAY_MS);
      const retry = await readCache(key); // 讀到 NOT_FOUND 會直接丟 404
      if (retry) {
        // console.log("cache HIT after wait", key);
        return retry;
      }
    }
    // 重試完還是沒有 → 往下直接查 DB（不搶鎖，所以不需要釋放）
  }

  try {
    // 3. 搶到鎖後再檢查一次快取：可能在搶鎖之前，別人剛好寫好了
    if (token !== null) {
      const again = await readCache(key);
      if (again) return again;
    }

    
    // ====== 快取都沒有，從 DB 取得資料 (Start) ============
    // 查 DB → 找不到就存 NOT_FOUND 並丟 404 → 找到就 setCache 並 return
    const [rows] = await pool.query<MemoRow[]>(
      "SELECT * FROM memos WHERE id = ?",
      [id],
    );

    const row = rows[0];
    if (!row) {
      // 丟 404 之前，先把 NOT_FOUND 存進快取，TTL 用 NOT_FOUND_TTL
      await setCache(key, NOT_FOUND, NOT_FOUND_TTL);

      // 將錯誤導至404，以免前端收到500錯誤
      throw notFoundError();
    }

    // 在DB找到的值，放進Redis做快取
    const dbResult = toMemo(row);
    await setCache(key, dbResult);
    return dbResult;
    // ====== 快取都沒有，從 DB 取得資料 (End) ============
  } finally {
    // 5. 不管成功、404 或錯誤，都要釋放鎖（token 不是 null 才釋放）
    if (token !== null) {
      await releaseLock(lockKey, token);
    }
  }
}
