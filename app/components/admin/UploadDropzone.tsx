"use client";

import { useEffect, useRef, useState } from "react";

export type UploadedAsset = {
  id: string;
  url: string;
  width: number;
  height: number;
  reused: boolean;
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
};

type UploadDropzoneProps = {
  /** S3 key 的中段，同時決定後端的白名單檢查 */
  folder: "hero" | "event" | "cases" | "case-covers" | "frames";
  onUploaded: (assets: UploadedAsset[]) => void;
  multiple?: boolean;
  /** 提示使用者此處期望的尺寸，與實際不符時給警告（不阻擋） */
  expected?: { width?: number; height?: number };
};

/** 併發 3：一次把 84 張全開會塞爆瀏覽器連線池，也容易撞上 S3 的速率限制 */
const CONCURRENCY = 3;

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
}: UploadDropzoneProps) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // objectURL 不釋放會一直佔著記憶體，一次選 20 張很有感
  useEffect(() => {
    return () => {
      for (const item of pending) URL.revokeObjectURL(item.previewUrl);
    };
  }, [pending]);

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
        });
      }
    }

    setPending(prepared);
    await upload(prepared);
  };

  const upload = async (items: Pending[]) => {
    const queue = items.filter((item) => item.status === "waiting");
    const uploaded: UploadedAsset[] = [];

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

          uploaded.push(await res.json());
          patch(item.uid, { status: "done" });
        } catch {
          patch(item.uid, { status: "error", error: "連線失敗" });
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker),
    );

    if (uploaded.length > 0) onUploaded(uploaded);
  };

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
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] border-2 border-dashed p-8 text-center transition-colors duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          dragOver
            ? "border-brand bg-brand-mist"
            : "border-brand/40 bg-white hover:border-brand"
        }`}
      >
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
        <ul className="flex flex-wrap gap-3">
          {pending.map((item) => {
            const warn = mismatch(item);
            return (
              <li
                key={item.uid}
                className="flex w-40 flex-col gap-1 rounded-[10px] border border-black/10 bg-white p-2"
              >
                {item.previewUrl ? (
                  // 預覽用 objectURL，next/image 不處理這種來源，故用原生 img
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-24 w-full rounded object-cover"
                  />
                ) : (
                  <div className="h-24 w-full rounded bg-brand-mist" />
                )}

                <p className="truncate text-caption text-brand-ink">
                  {item.file.name}
                </p>

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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
