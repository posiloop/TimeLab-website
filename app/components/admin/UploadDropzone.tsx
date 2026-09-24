"use client";

import { ImageUp, X } from "lucide-react";
import { PreviewableImage } from "./ImagePreview";
import { useEffect, useRef, useState } from "react";

export type UploadedAsset = {
  id: string;
  url: string;
  width: number;
  height: number;
  reused: boolean;
  /** 上傳前填的名稱。未開啟 nameField 時為空字串 */
  name: string;
};

type Pending = {
  /** 供 React key 用，檔名可能重複 */
  uid: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  status: "waiting" | "uploading" | "done" | "error";
  error?: string;
  /** nameField 開啟時，使用者在縮圖下方填的名稱 */
  name: string;
};

type UploadDropzoneProps = {
  /** S3 key 的中段，同時決定後端的白名單檢查 */
  folder: "hero" | "event" | "cases" | "case-covers" | "frames";
  onUploaded: (assets: UploadedAsset[]) => void;
  multiple?: boolean;
  /** 提示使用者此處期望的尺寸，與實際不符時給警告（不阻擋） */
  expected?: { width?: number; height?: number };
  /**
   * 每張縮圖下方多一個名稱欄位，填的值隨 onUploaded 一起回傳。
   * 給上傳後還需要命名的地方（案例項目）用 —— 在這裡填完，
   * 圖片一進清單就有名字，不必傳完再逐張回頭補
   */
  nameField?: { label: string; placeholder?: string };
};

/** 併發 3：一次把 84 張全開會塞爆瀏覽器連線池，也容易撞上 S3 的速率限制 */
const CONCURRENCY = 3;

/**
 * 這個項目按下「開始上傳」時會被送出嗎？
 *
 * 上次失敗的一併重試 —— 失敗多半是連線問題，要使用者重選一次檔案
 * 才能重傳沒有道理。但讀不出來的圖（previewUrl 為空）怎麼重試都不會成功，
 * 排除掉免得每次都再失敗一輪。
 */
const isRetryable = (item: Pending) =>
  item.status === "waiting" ||
  (item.status === "error" && item.previewUrl !== "");

/** 讀出圖片的實際尺寸供預覽顯示。這個值只給使用者看，寫入資料庫的
    尺寸一律以伺服器 sharp 讀出的為準 —— 前端的值可被竄改 */
function readSize(file: File): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () =>
      resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("讀不出圖片"));
    };
    img.src = url;
  });
}

export default function UploadDropzone({
  folder,
  onUploaded,
  multiple = true,
  expected,
  nameField,
}: UploadDropzoneProps) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // objectURL 不釋放會一直佔著記憶體，一次選 20 張很有感。
  // 用 ref 讀最新的清單，而非讓 effect 依賴 pending —— 依賴它的話，
  // 每次更新上傳狀態都會先跑一次 cleanup 把所有網址釋放掉，縮圖就全黑了
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  useEffect(() => {
    return () => {
      for (const item of pendingRef.current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  const drop = (uid: string) =>
    setPending((prev) => {
      const target = prev.find((item) => item.uid === uid);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.uid !== uid);
    });

  const clear = () =>
    setPending((prev) => {
      for (const item of prev) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      return [];
    });

  const accept = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const list = Array.from(files);
    const prepared: Pending[] = [];

    for (const file of list) {
      try {
        const { url, width, height } = await readSize(file);
        prepared.push({
          uid: crypto.randomUUID(),
          file,
          previewUrl: url,
          width,
          height,
          status: "waiting",
          name: "",
        });
      } catch {
        prepared.push({
          uid: crypto.randomUUID(),
          file,
          previewUrl: "",
          width: 0,
          height: 0,
          status: "error",
          error: "不是有效的圖片",
          name: "",
        });
      }
    }

    // 只排進待傳清單，等使用者按下「開始上傳」。選錯檔案時能先移除，
    // 不必等傳完再回頭刪 —— 刪除要連 S3 上的檔案一起處理，麻煩得多。
    // 多檔模式用附加，讓使用者能分幾次挑完再一起傳；單檔模式（分類封面）
    // 則取代，否則連選兩次會累積出兩張待傳，與「只能一張」互相矛盾
    setPending((prev) => {
      if (multiple) return [...prev, ...prepared];
      for (const item of prev) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      return prepared.slice(-1);
    });
  };

  const upload = async () => {
    const queue = pendingRef.current.filter(isRetryable);
    if (queue.length === 0) return;

    const uploaded: UploadedAsset[] = [];
    setUploading(true);

    const patch = (uid: string, change: Partial<Pending>) =>
      setPending((prev) =>
        prev.map((item) => (item.uid === uid ? { ...item, ...change } : item)),
      );

    // 走 fetch 而非 server action：後者 body 上限 1MB，且從 client 呼叫是
    // 序列執行的，Promise.all 不會真的平行
    const worker = async () => {
      for (;;) {
        const item = queue.shift();
        if (!item) return;

        patch(item.uid, { status: "uploading" });

        const form = new FormData();
        form.append("file", item.file);
        form.append("folder", folder);

        try {
          const res = await fetch("/api/admin/upload", {
            method: "POST",
            body: form,
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            // 單檔失敗不中斷其餘 —— 傳到第 60 張才失敗就整批作廢，
            // 對使用者是災難
            patch(item.uid, {
              status: "error",
              error: body.error ?? "上傳失敗",
            });
            continue;
          }

          // 名稱由前端保管，後端只存檔案 —— 它屬於「案例項目」這筆資料，
          // 不是檔案本身的屬性，故在這裡併回結果交給呼叫端
          const asset: Omit<UploadedAsset, "name"> = await res.json();
          uploaded.push({ ...asset, name: item.name.trim() });
          patch(item.uid, { status: "done" });
        } catch {
          patch(item.uid, { status: "error", error: "連線失敗" });
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker),
    );

    setUploading(false);

    // 傳成功的從待傳清單移除 —— 它們已經出現在上方的正式清單裡，
    // 留著會是同一張圖顯示兩次。失敗的留下來，使用者才看得出是哪幾張
    setPending((prev) => {
      const kept = prev.filter((item) => item.status !== "done");
      for (const item of prev) {
        if (item.status === "done" && item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
      return kept;
    });

    if (uploaded.length > 0) onUploaded(uploaded);
  };

  const queued = pending.filter(isRetryable).length;

  const mismatch = (item: Pending) => {
    if (!expected || item.status === "error") return null;
    const parts: string[] = [];
    if (expected.width && item.width !== expected.width) {
      parts.push(`寬 ${item.width}（此處慣用 ${expected.width}）`);
    }
    if (expected.height && item.height !== expected.height) {
      parts.push(`高 ${item.height}（此處慣用 ${expected.height}）`);
    }
    return parts.length > 0 ? parts.join("、") : null;
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void accept(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] border-2 border-dashed px-8 py-14 text-center transition-colors duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          dragOver
            ? "border-brand bg-brand-mist"
            : "border-brand/40 bg-white hover:border-brand"
        }`}
      >
        <ImageUp aria-hidden className="size-7 text-brand/70" />
        <span className="text-sm font-bold text-brand">
          把圖片拖到這裡，或點擊選擇檔案
        </span>
        <span className="text-caption text-brand-ink">
          支援 JPG、PNG、WebP，單檔上限 12MB
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={multiple}
          onChange={(event) => {
            void accept(event.target.files);
            // 清空才能連續選同一個檔案
            event.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {pending.length > 0 && (
        // 等寬網格而非 flex-wrap，與各頁的正式清單一致。有名稱欄位時
        // 欄數少一些，讓輸入框有足夠寬度
        <ul
          className={`grid gap-3 ${
            nameField
              ? "grid-cols-5 max-2xl:grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-2"
              : "grid-cols-7 max-2xl:grid-cols-5 max-lg:grid-cols-4 max-md:grid-cols-2"
          }`}
        >
          {pending.map((item) => {
            const warn = mismatch(item);
            return (
              <li
                key={item.uid}
                className="flex flex-col gap-1 rounded-[10px] border border-black/10 bg-white p-2"
              >
                {item.previewUrl ? (
                  // 縮圖裁切過，點開才看得到完整構圖 —— 上傳前就該能確認
                  // 選對了檔案。localOnly：檔案還在本機，沒有下載的道理
                  <PreviewableImage
                    src={item.previewUrl}
                    caption={item.file.name}
                    localOnly
                    className="aspect-[4/3] w-full rounded object-cover"
                  />
                ) : (
                  <div className="aspect-[4/3] w-full rounded bg-brand-mist" />
                )}

                <div className="flex items-start justify-between gap-1">
                  <p className="min-w-0 flex-1 truncate text-caption text-brand-ink">
                    {item.file.name}
                  </p>
                  {/* 已傳上去的不給移除 —— 那要連 S3 的檔案一起處理，
                      是各頁自己的「移除」按鈕負責的事 */}
                  {item.status !== "done" && (
                    <button
                      type="button"
                      onClick={() => drop(item.uid)}
                      disabled={uploading}
                      aria-label={`不要上傳 ${item.file.name}`}
                      className="shrink-0 text-brand-ink/40 transition-colors hover:text-red-600 disabled:opacity-40"
                    >
                      <X aria-hidden className="size-3.5" />
                    </button>
                  )}
                </div>

                {item.status === "error" ? (
                  <p className="text-caption text-red-600">{item.error}</p>
                ) : (
                  <p className="text-caption text-brand-ink/70">
                    {item.width} × {item.height}
                    {item.status === "uploading" && " · 上傳中…"}
                    {item.status === "done" && " · 完成"}
                  </p>
                )}

                {warn && (
                  <p className="text-caption text-amber-600">尺寸不同：{warn}</p>
                )}

                {nameField && item.status !== "error" && (
                  <label className="mt-1 flex flex-col gap-1">
                    <span className="text-caption text-brand-ink/70">
                      {nameField.label}
                    </span>
                    <input
                      value={item.name}
                      onChange={(event) =>
                        setPending((prev) =>
                          prev.map((row) =>
                            row.uid === item.uid
                              ? { ...row, name: event.target.value }
                              : row,
                          ),
                        )
                      }
                      disabled={uploading}
                      placeholder={nameField.placeholder}
                      className="rounded-[6px] border border-black/15 px-2 py-1 text-caption outline-none focus:border-brand disabled:bg-black/5"
                    />
                  </label>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {queued > 0 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void upload()}
            disabled={uploading}
            className="rounded-full bg-brand px-5 py-2 text-caption text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {uploading ? "上傳中…" : `開始上傳 ${queued} 張`}
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={uploading}
            className="rounded-full px-4 py-2 text-caption text-brand-ink/70 transition-colors hover:bg-black/5 disabled:opacity-50"
          >
            全部清除
          </button>
        </div>
      )}
    </div>
  );
}
