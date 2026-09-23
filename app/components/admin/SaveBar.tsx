"use client";

import { useEffect } from "react";

type SaveBarProps = {
  /** 尚未儲存的變更筆數；0 時整條列會滑出畫面 */
  count: number;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * 底部的未儲存提示列。
 *
 * 採「明確儲存」而非每次拖拉即時寫入：後者會讓調整一排 12 張的順序
 * 觸發數十次前台失效，且使用者拖到一半改變主意時無法取消。
 */
export default function SaveBar({
  count,
  saving,
  onSave,
  onCancel,
}: SaveBarProps) {
  const dirty = count > 0;

  // 對非技術使用者來說，改完沒按儲存就關掉視窗是最容易發生的失誤
  useEffect(() => {
    if (!dirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <div
      // 以 translate 收起而非卸載，讓進出都有過場；隱藏時移除互動
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        dirty ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      aria-hidden={!dirty}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 rounded-t-[16px] bg-brand px-6 py-4 text-white shadow-[0_-4px_16px_rgba(0,0,0,0.12)] max-md:gap-2 max-md:px-4">
        <span className="text-sm">有 {count} 項變更尚未儲存</span>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-full px-4 py-2 text-sm transition-colors hover:bg-white/15 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-brand transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {saving ? "儲存中…" : "儲存並更新網站"}
          </button>
        </div>
      </div>
    </div>
  );
}
