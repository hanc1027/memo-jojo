
import { useState, type ComponentProps } from 'react';
import { createMemo } from './api';
import type { CreateMemoInput } from './api';

type FormSubmitHandler = NonNullable<
  ComponentProps<'form'>['onSubmit']
>;

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      console.log('Created Memo:', memo);

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
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              新增 Memo
            </h1>
          </div>

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
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                rows={5}
                placeholder="請輸入 Memo 內容"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                Memo 新增成功！
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '新增中...' : '新增 Memo'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default App;
