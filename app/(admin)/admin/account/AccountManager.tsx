"use client";

import { Check, Copy, KeyRound, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/app/components/admin/Toast";
import { createAccount, removeAccount, resetPassword } from "../actions";

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
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  // 剛產生的帳密。明文只有這一次拿得到，資料庫存的是雜湊，
  // 所以要留在畫面上直到使用者自己關掉
  const [issued, setIssued] = useState<{
    email: string;
    password: string;
    kind: "created" | "reset";
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const add = (formData: FormData) => {
    setError("");
    setIssued(null);
    setCopied(false);
    startTransition(async () => {
      const result = await createAccount(formData);
      if (!result.ok) {
        toast(result.error, "error");
        return setError(result.error);
      }
      setAdding(false);
      setIssued({
        email: result.email,
        password: result.password,
        kind: "created",
      });
      toast("帳號已建立，請複製密碼交給對方");
      router.refresh();
    });
  };

  const copy = async () => {
    if (!issued) return;
    await navigator.clipboard.writeText(
      `帳號：${issued.email}\n密碼：${issued.password}`,
    );
    setCopied(true);
  };

  const reset = (user: User) => {
    const self = user.id === currentUserId;
    const message = self
      ? "重設自己的密碼？\n\n新密碼會顯示在畫面上，請先複製再關掉。\n目前這個視窗不會被登出，但其他裝置上的登入會失效。"
      : `重設「${user.name}」的密碼？\n\n舊密碼會立刻失效，該帳號在所有裝置上也會被登出。`;

    if (!confirm(message)) return;
    setError("");
    setIssued(null);
    setCopied(false);
    startTransition(async () => {
      const result = await resetPassword(user.id);
      if (!result.ok) {
        toast(result.error, "error");
        return setError(result.error);
      }
      setIssued({
        email: result.email,
        password: result.password,
        kind: "reset",
      });
      toast("密碼已重設，請複製後交給對方");
      router.refresh();
    });
  };

  const remove = (user: User) => {
    if (!confirm(`確定刪除「${user.name}」（${user.email}）的帳號？`)) return;
    setError("");
    startTransition(async () => {
      const result = await removeAccount(user.id);
      if (!result.ok) {
        toast(result.error, "error");
        return setError(result.error);
      }
      toast(`已刪除「${user.name}」的帳號`);
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
      {issued && (
        <div className="flex flex-col gap-3 rounded-[12px] border-2 border-brand bg-brand-mist p-4">
          <div>
            <p className="text-sm font-bold text-brand">
              {issued.kind === "created" ? "帳號已建立" : "密碼已重設"}
            </p>
            <p className="text-caption text-brand-ink">
              密碼只會顯示這一次，關掉之後就看不到了 ——
              請先複製並交給對方。
            </p>
          </div>

          <dl className="flex flex-col gap-1 rounded-[8px] bg-white p-3">
            <div className="flex gap-2 text-sm">
              <dt className="w-12 shrink-0 text-brand-ink/60">帳號</dt>
              <dd className="break-all">{issued.email}</dd>
            </div>
            <div className="flex gap-2 text-sm">
              <dt className="w-12 shrink-0 text-brand-ink/60">密碼</dt>
              {/* 等寬字讓 l 與 1、0 與 O 之類的字元容易分辨 */}
              <dd className="break-all font-mono font-bold">
                {issued.password}
              </dd>
            </div>
          </dl>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="flex items-center gap-1 rounded-full bg-brand px-4 py-2 text-caption font-bold text-white transition-opacity hover:opacity-85"
            >
              {copied ? (
                <Check aria-hidden className="size-3.5" />
              ) : (
                <Copy aria-hidden className="size-3.5" />
              )}
              {copied ? "已複製" : "複製帳號密碼"}
            </button>
            <button
              type="button"
              onClick={() => setIssued(null)}
              className="rounded-full px-3 py-2 text-caption text-brand-ink transition-colors hover:bg-white"
            >
              我已經複製好了
            </button>
          </div>
        </div>
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

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => reset(user)}
                disabled={pending}
                className="flex items-center gap-1 rounded-full px-3 py-1 text-caption text-brand transition-colors hover:bg-brand-mist disabled:cursor-not-allowed disabled:text-brand-ink/30 disabled:hover:bg-transparent"
              >
                <KeyRound aria-hidden className="size-3.5" />
                重設密碼
              </button>

              <button
                type="button"
                onClick={() => remove(user)}
                // 刪掉自己會當場登出，且可能讓後台無人可管
                disabled={pending || user.id === currentUserId}
                className="flex items-center gap-1 rounded-full px-3 py-1 text-caption text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-brand-ink/30 disabled:hover:bg-transparent"
              >
                <Trash aria-hidden className="size-3.5" />
                刪除
              </button>
            </div>
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

          <p className="text-caption text-brand-ink/60">
            密碼由系統自動產生，建立後會顯示一次，請複製後交給對方。
          </p>

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
