
import { pool } from "../db/pool.ts";
import { toMemo, type Memo, type MemoRow } from "./shared.ts";

export async function listMemos(): Promise<Memo[]> {
  const [rows] = await pool.query<MemoRow[]>(
    "SELECT * FROM memos ORDER BY id DESC",
  );
  return rows.map(toMemo);
}