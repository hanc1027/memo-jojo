import {
  genRedisKey,
  getCache,
  NOT_FOUND,
  NOT_FOUND_TTL,
  setCache,
} from "../cache/redis.ts";
import { pool } from "../db/pool.ts";
import { notFoundError } from "../errors/app-error.ts";
import { toMemo, type Memo, type MemoRow } from "./shared.ts";

export async function getMemo(id: number): Promise<Memo> {
  const key = genRedisKey(id);

  // 新增：先查 Redis
  const cached = await getCache<Memo | typeof NOT_FOUND>(key);

  // 如果 cached 是 NOT_FOUND，直接丟 404（不查 DB）
  if (cached === NOT_FOUND) {
    throw notFoundError();
  }

  if (cached) {
    console.log("cache HIT", key);
    return cached;
  }
  console.log("cache MISS", key);

  // 本來從DB取得資料的方式
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
}
