import { delCache, genRedisKey } from "../cache/redis.ts";
import { pool } from "../db/pool.ts";
import type { components } from "../types/api.ts";
import { getMemo } from "./get.ts";
import type { Memo } from "./shared.ts";

type UpdateMemoInput = components["schemas"]["UpdateMemoInput"];

export async function updateMemo(
  id: number,
  input: UpdateMemoInput,
): Promise<Memo> {
  const sets: string[] = [];
  const values: (string | number)[] = [];

  // 使用hardcoded的方式填寫要更新的欄位，避免 SQL Injection
  if (input.title !== undefined) {
    sets.push("title = ?");
    values.push(input.title);
  }
  if (input.content !== undefined) {
    sets.push("content = ?");
    values.push(input.content);
  }

  if (sets.length > 0) {
    await pool.query(`UPDATE memos SET ${sets.join(", ")} WHERE id = ?`, [
      ...values,
      id,
    ]);

    await delCache(genRedisKey(id));
  }

  return getMemo(id); // 找不到會丟 404，找到就回傳最新資料
}
