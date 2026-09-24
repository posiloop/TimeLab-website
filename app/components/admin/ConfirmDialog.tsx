"use client";

import { TriangleAlert } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ConfirmOptions = {
  title: string;
  /** 每個字串顯示為一段，取代 confirm() 只能用 \n 分行的窘境 */
  body?: string[];
  /** 確認鈕文字，預設「確定」。寫成動詞比「確定」更能讓人知道會發生什麼 */
  confirmLabel?: string;
  /** 刪除這類不可復原的操作設為 true，確認鈕轉為紅色 */
  danger?: boolean;
};

type Ask = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Ask>(async () => false);

/** 回傳一個 async 函式，await 它就能得知使用者按了確認或取消 */
export function useConfirm() {
  return useContext(ConfirmContext);
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

/**
 * 取代瀏覽器內建的 confirm()。
 *
 * 內建對話框長得像系統層級的警告，與後台的視覺完全脫節，也無法分辨
 * 「刪除」與「重設」的輕重。這裡用原生 <dialog> 取得焦點鎖定與 Esc 關閉，
 * 與 app/components/Modal.tsx 同一套做法。
 */
export default function ConfirmProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const ask = useCallback<Ask>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...options, resolve });
      }),
    [],
  );

  const settle = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (pending && !dialog.open) {
      dialog.showModal();
      // 預設焦點放在確認鈕，鍵盤使用者按 Enter 即可完成
      confirmRef.current?.focus();
    } else if (!pending && dialog.open) {
      dialog.close();
    }
  }, [pending]);

  return (
    <ConfirmContext.Provider value={ask}>
      {children}

      <dialog
        ref={dialogRef}
        // Esc 關閉時視同取消，等待中的 Promise 不能就這樣懸著
        onClose={() => settle(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) settle(false);
        }}
        className="m-auto w-[420px] max-w-[calc(100vw-2rem)] rounded-[16px] bg-white p-0 shadow-[0_8px_32px_rgba(0,0,0,0.16)] backdrop:bg-black/50"
      >
        {pending && (
          <div className="flex flex-col gap-4 p-6">
            <div className="flex gap-3">
              {pending.danger && (
                <TriangleAlert
                  aria-hidden
                  className="mt-0.5 size-5 shrink-0 text-red-600"
                />
              )}
              <div className="flex flex-col gap-2">
                <h2 className="text-sm font-bold text-brand-ink">
                  {pending.title}
                </h2>
                {pending.body?.map((line) => (
                  <p key={line} className="text-caption text-brand-ink/70">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => settle(false)}
                className="rounded-full px-4 py-2 text-caption text-brand-ink transition-colors hover:bg-brand-mist"
              >
                取消
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={() => settle(true)}
                className={`rounded-full px-5 py-2 text-caption font-bold text-white transition-opacity hover:opacity-85 ${
                  pending.danger ? "bg-red-600" : "bg-brand"
                }`}
              >
                {pending.confirmLabel ?? "確定"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
