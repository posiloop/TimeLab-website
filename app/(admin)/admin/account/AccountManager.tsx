"use client";

import { Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAccount, removeAccount } from "../actions";

type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function AccountManager({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const add = (formData: FormData) => {
    setError("");
    setDone("");
    startTransition(async () => {
      const result = await createAccount(formData);
      if (!result.ok) return setError(result.error);
      setAdding(false);
      setDone("帳號已建立。");
      router.refresh();
    });
  };

  const remove = (user: User) => {
    if (!confirm(`確定刪除「${user.name}」（${user.email}）的帳號？`)) return;
    setError("");
    startTransition(async () => {
      const result = await removeAccount(user.id);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-h2 text-brand-ink">帳號管理</h1>
        <p className="mt-1 text-sm text-brand-ink/70">
          能登入這個後台的帳號。網站沒有開放對外註冊，帳號只能在這裡新增。
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-[8px] bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {done && (
        <p className="rounded-[8px] bg-brand-mist px-4 py-2 text-sm text-brand">
          {done}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {users.map((user) => (
          <li
            key={user.id}
            className="card-surface flex items-center justify-between gap-3 rounded-[10px] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-brand-ink">
                {user.name}
                {user.id === currentUserId && (
                  <span className="ml-2 rounded-full bg-brand-mist px-2 py-0.5 text-caption font-normal text-brand">
                    目前登入中
                  </span>
                )}
              </p>
              <p className="truncate text-caption text-brand-ink/60">
                {user.email}　建立於 {user.createdAt}
              </p>
            </div>

            <button
              type="button"
              onClick={() => remove(user)}
              // 刪掉自己會當場登出，且可能讓後台無人可管
              disabled={pending || user.id === currentUserId}
              className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-caption text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-brand-ink/30 disabled:hover:bg-transparent"
            >
              <Trash aria-hidden className="size-3.5" />
              刪除
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <form
          action={add}
          className="card-surface flex flex-col gap-3 rounded-[12px] p-4"
        >
          <label className="flex flex-col gap-1">
            <span className="text-caption text-brand-ink">姓名</span>
            <input
              name="name"
              required
              className="rounded-[8px] border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-caption text-brand-ink">Email</span>
            <input
              name="email"
              type="email"
              required
              className="rounded-[8px] border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-caption text-brand-ink">
              密碼（至少 12 個字元）
            </span>
            <input
              name="password"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              className="rounded-[8px] border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {pending ? "建立中…" : "建立帳號"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-full px-4 py-2 text-sm text-brand-ink transition-colors hover:bg-brand-mist"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 self-start rounded-full border-2 border-dashed border-brand/40 px-5 py-2 text-sm text-brand transition-colors hover:border-brand hover:bg-white"
        >
          <Plus aria-hidden className="size-4" />
          新增帳號
        </button>
      )}
    </div>
  );
}
