import type { RowDataPacket } from "mysql2/promise";
import type { components } from "../types/api.ts";

export type Memo = components["schemas"]["Memo"];

/**
 * 查詢類型	|  要用的型別
 * SELECT  |	RowDataPacket[]
 * INSERT、UPDATE、DELETE | 	ResultSetHeader
 */

// pool.query<T>(...) 的 T 有限制，只能是 mysql2 認得的幾種結果型別，其中 SELECT 的結果必須是 RowDataPacket[]（或它的子型別）
export interface MemoRow extends RowDataPacket {
  id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export function toMemo(row: MemoRow): Memo {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}