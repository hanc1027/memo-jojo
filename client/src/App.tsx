
import { useEffect, useState, type ComponentProps } from 'react';
import {
  createMemo,
  getMemos,
  updateMemo,
  type CreateMemoInput,
  type Memo,
} from './api';

type FormSubmitHandler = NonNullable<
  ComponentProps<'form'>['onSubmit']
>;

function App() {
  // Create Memo State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Memo List State
  const [memos, setMemos] = useState<Memo[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Update Memo State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // 取得 Memo List
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
            err instanceof Error ? err.message : '取得 Memo 清單失敗',
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

  // Create Memo
  const handleCreate: FormSubmitHandler = async (event) => {
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

      setMemos((prev) => [memo, ...prev]);
      setTitle('');
      setContent('');
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '新增 Memo 失敗',
      );
    } finally {
      setLoading(false);
    }
  };

  // 進入編輯模式
  const handleEdit = (memo: Memo) => {
    setEditingId(memo.id);
    setEditTitle(memo.title);
    setEditContent(memo.content);
    setUpdateError(null);
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setUpdateError(null);
  };

  // 更新 Memo
  const handleUpdate: FormSubmitHandler = async (event) => {
    event.preventDefault();

    if (editingId === null) return;

    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const updatedMemo = await updateMemo(editingId, {
        title: editTitle,
        content: editContent,
      });

      setMemos((prev) =>
        prev.map((memo) =>
          memo.id === updatedMemo.id ? updatedMemo : memo,
        ),
      );

      handleCancelEdit();
    } catch (err) {
      setUpdateError(
        err instanceof Error ? err.message : '更新 Memo 失敗',
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Memo App
        </h1>

        {/* Create Memo */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            新增 Memo
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="請輸入標題"
              maxLength={100}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="請輸入內容"
              rows={4}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {success && (
              <p className="text-sm text-green-600">
                Memo 新增成功！
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '新增中...' : '新增 Memo'}
            </button>
          </form>
        </section>

        {/* Memo List */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Memo 清單
          </h2>

          {listLoading && (
            <p className="text-gray-500">載入中...</p>
          )}

          {listError && (
            <p className="text-red-600">{listError}</p>
          )}

          {!listLoading && !listError && memos.length === 0 && (
            <p className="rounded-lg bg-white p-6 text-center text-gray-500">
              目前沒有 Memo
            </p>
          )}

          <div className="space-y-4">
            {memos.map((memo) => (
              <article
                key={memo.id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                {editingId === memo.id ? (
                  /* Edit Mode */
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(event) =>
                        setEditTitle(event.target.value)
                      }
                      maxLength={100}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
                    />

                    <textarea
                      value={editContent}
                      onChange={(event) =>
                        setEditContent(event.target.value)
                      }
                      rows={4}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
                    />

                    {updateError && (
                      <p className="text-sm text-red-600">
                        {updateError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updateLoading ? '儲存中...' : '儲存'}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={updateLoading}
                        className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                      >
                        取消
                      </button>
                    </div>
                  </form>
                ) : (
                  /* View Mode */
                  <>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {memo.title}
                    </h3>

                    <p className="mt-2 whitespace-pre-wrap text-gray-600">
                      {memo.content}
                    </p>

                    <p className="mt-3 text-xs text-gray-400">
                      建立時間：{new Date(memo.createdAt).toLocaleString()}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(memo)}
                        disabled={updateLoading}
                        className="rounded-lg bg-blue-100 px-4 py-2 text-sm text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                      >
                        編輯
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
