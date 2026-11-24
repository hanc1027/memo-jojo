import { getCache, MEMO_LIST_KEY, setCache } from "../cache/redis.ts";
import { pool } from "../db/pool.ts";
import { toMemo, type Memo, type MemoRow } from "./shared.ts";

export async function listMemos(): Promise<Memo[]> {
  // 新增：先查 Redis
  const cached = await getCache<Memo[]>(MEMO_LIST_KEY);
  if (cached) {
    console.log("cache HIT", MEMO_LIST_KEY);
    return cached;
  }
  console.log("cache MISS", MEMO_LIST_KEY);

  const [rows] = await pool.query<MemoRow[]>(
    "SELECT * FROM memos ORDER BY id DESC",
  );

  const dbResult = rows.map(toMemo);
  await setCache(MEMO_LIST_KEY, dbResult);
  return dbResult;
}
