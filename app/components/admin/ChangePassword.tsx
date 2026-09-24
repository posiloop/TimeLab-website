"use client";

import { KeyRound } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { changeOwnPassword } from "@/app/(admin)/admin/actions";
import { useToast } from "./Toast";

/**
 * 修改自己的密碼。
 *
 * 放在側邊欄底部而非帳號管理頁：那一頁管的是「有哪些人能登入」，
 * 而這是「我自己的設定」，貼著名字與登出放才找得到。
 *
 * 與帳號頁重設別人密碼的差別在於這裡可以自訂 —— 自己的密碼要記得住
 * 才有意義，隨機字串反而每次都得去翻紀錄。
 */
export default function ChangePassword() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const submit = (formData: FormData) => {
    const current = String(formData.get("current") ?? "");
    const next = String(formData.get("password") ?? "");
    const again = String(formData.get("confirm") ?? "");

    if (next.length < 12) return setError("新密碼至少 12 個字元");
    if (next !== again) return setError("兩次輸入的新密碼不一致");

    setError("");
    startTransition(async () => {
      const result = await changeOwnPassword(current, next);
      if (!result.ok) {
        toast(result.error, "error");
        return setError(result.error);
      }
      setOpen(false);
      toast("密碼已更新，下次請用新密碼登入");
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-caption text-brand transition-colors hover:bg-white"
      >
        <KeyRound aria-hidden className="size-3.5" />
        修改密碼
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        className="m-auto w-[420px] max-w-[calc(100vw-2rem)] rounded-[16px] bg-white p-0 shadow-[0_8px_32px_rgba(0,0,0,0.16)] backdrop:bg-black/50"
      >
        {open && (
          <form action={submit} className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-bold text-brand-ink">修改密碼</h2>
              <p className="text-caption text-brand-ink/70">
                改完之後，這個視窗不會被登出，但其他裝置上的登入會失效。
              </p>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-caption text-brand-ink">目前的密碼</span>
              <input
                name="current"
                type="password"
                required
                autoComplete="current-password"
                autoFocus
                className="rounded-[8px] border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-caption text-brand-ink">
                新密碼（至少 12 個字元）
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

            <label className="flex flex-col gap-1">
              <span className="text-caption text-brand-ink">再輸入一次新密碼</span>
              <input
                name="confirm"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                className="rounded-[8px] border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </label>

            {error && (
              <p role="alert" className="text-caption text-red-600">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-2 text-caption text-brand-ink transition-colors hover:bg-brand-mist"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-brand px-5 py-2 text-caption font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {pending ? "更新中…" : "更新密碼"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
