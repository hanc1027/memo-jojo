
import { useEffect, useState, type ComponentProps } from 'react';
import { createMemo, getMemos } from './api';
import type { CreateMemoInput, Memo } from './api';

type FormSubmitHandler = NonNullable<
  ComponentProps<'form'>['onSubmit']
>;

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [memos, setMemos] = useState<Memo[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 初次載入 Memo 清單
  useEffect(() => {
    let cancelled = false;

    const loadMemos = async () => {
      try {
        const data = await getMemos();

        if (!cancelled) {
          setMemos(data);
          setListError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setListError(
            err instanceof Error
              ? err.message
              : '取得 Memo 清單失敗',
          );
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
        }
      }
    };

    void loadMemos();

    return () => {
      cancelled = true;
    };
  }, []);

  // 新增 Memo
  const handleSubmit: FormSubmitHandler = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const input: CreateMemoInput = {
        title,
        content,
      };

      const memo = await createMemo(input);

      // 後端清單依 id DESC 排序，因此新資料放最前面 (直接更新前端狀態，避免多call 一次api)
      setMemos((prev) => [memo, ...prev]);

      setTitle('');
      setContent('');
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '發生未知錯誤',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl space-y-8">

        {/* 新增 Memo */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h1 className="mb-6 text-2xl font-bold text-slate-900">
            Memo App
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                標題
              </label>

              <input
                id="title"
                type="text"
                placeholder="請輸入 Memo 標題"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={100}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                內容
              </label>

              <textarea
                id="content"
                rows={4}
                placeholder="請輸入 Memo 內容"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
                className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                Memo 新增成功！
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '新增中...' : '新增 Memo'}
            </button>
          </form>
        </section>

        {/* Memo 清單 */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Memo 清單
            </h2>

            <span className="text-sm text-slate-500">
              共 {memos.length} 筆
            </span>
          </div>

          {listLoading && (
            <p className="py-8 text-center text-sm text-slate-500">
              載入中...
            </p>
          )}

          {listError && (
            <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {listError}
            </div>
          )}

          {!listLoading && !listError && memos.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-sm text-slate-500">
                目前還沒有 Memo，新增第一筆吧！
              </p>
            </div>
          )}

          <div className="space-y-3">
            {memos.map((memo) => (
              <article
                key={memo.id}
                className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <h3 className="font-semibold text-slate-900">
                  {memo.title}
                </h3>

                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                  {memo.content}
                </p>

                <p className="mt-4 text-xs text-slate-400">
                  建立時間：{new Date(memo.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
