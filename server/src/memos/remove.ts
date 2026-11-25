import type { ResultSetHeader } from "mysql2/promise";
import { delCache, genRedisKey, MEMO_LIST_KEY } from "../cache/redis.ts";
import { pool } from "../db/pool.ts";
import { notFoundError } from "../errors/app-error.ts";

export async function removeMemo(id: number): Promise<void> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM memos WHERE id = ?",
    [id],
  );

  // affectedRows 用來傳回上一條 DML 所影響的紀錄數
  if (result.affectedRows === 0) {
    throw notFoundError();
  }

  // DB 實際有刪除資料後，再將 redis 快取刪除，才不致於redis又存了DB已刪的舊資料
  await delCache(genRedisKey(id), MEMO_LIST_KEY);
}
