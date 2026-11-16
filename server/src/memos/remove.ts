import type { ResultSetHeader } from "mysql2/promise";
import { pool } from "../db/pool.ts";

export async function removeMemo(id: number): Promise<void> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM memos WHERE id = ?",
    [id],
  );

  // affectedRows 用來傳回上一條 DML 所影響的紀錄數
  if (result.affectedRows === 0) {
    throw Object.assign(new Error("Memo not found"), { status: 404 });
  }
}