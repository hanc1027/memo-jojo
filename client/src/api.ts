
export interface Memo {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoInput {
  title: string;
  content: string;
}
export interface UpdateMemoInput {
  title?: string;
  content?: string;
}

// 取得全部的 memos
export async function getMemos(): Promise<Memo[]> {
  const response = await fetch('/api/memos');

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? '取得 Memo 清單失敗');
  }

  return data as Memo[];
}

// 建立 memo
export async function createMemo(
  input: CreateMemoInput,
): Promise<Memo> {
  const response = await fetch('/api/memos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? '新增 Memo 失敗');
  }

  return data as Memo;
}

// 更新 memo
export async function updateMemo(
  id: number,
  input: UpdateMemoInput,
): Promise<Memo> {
  const response = await fetch(`/api/memos/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? '更新 Memo 失敗');
  }

  return data as Memo;
}


// 刪除 memo
export async function deleteMemo(id: number): Promise<void> {
  const response = await fetch(`/api/memos/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? '刪除 Memo 失敗');
  }
}