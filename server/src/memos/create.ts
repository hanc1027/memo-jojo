import type { ResultSetHeader } from "mysql2/promise";
import { pool } from "../db/pool.ts";
import type { components } from "../types/api.ts";
import { toMemo, type Memo, type MemoRow } from "./shared.ts";

type CreateMemoInput = components["schemas"]["CreateMemoInput"];

export async function createMemo(input: CreateMemoInput): Promise<Memo> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO memos (title, content) VALUES (?, ?)",
    [input.title, input.content],
  );

  const [rows] = await pool.query<MemoRow[]>(
    "SELECT * FROM memos WHERE id = ?",
    [result.insertId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error("取得創建的 memo 失敗");
  }
  return toMemo(row);
}