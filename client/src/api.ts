
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

export async function getMemos(): Promise<Memo[]> {
  const response = await fetch('/memos');

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? '取得 Memo 清單失敗');
  }

  return data as Memo[];
}

export async function createMemo(
  input: CreateMemoInput,
): Promise<Memo> {
  const response = await fetch('/memos', {
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
