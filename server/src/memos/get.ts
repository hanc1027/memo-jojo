
import { pool } from "../db/pool.ts";
import { toMemo, type Memo, type MemoRow } from "./shared.ts";

export async function getMemo(id: number): Promise<Memo> {
  const [rows] = await pool.query<MemoRow[]>(
    "SELECT * FROM memos WHERE id = ?",
    [id]
  );

  const row = rows[0];
  if (!row) {
    // 將錯誤導至404，以免前端收到500錯誤
    throw Object.assign(new Error("找不到該Memo"), { status: 404 });
  }
  return toMemo(row);
}