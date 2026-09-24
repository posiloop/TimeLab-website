"use client";

import { useEffect, useRef, useState } from "react";

export type ConvertedFrame = {
  posterId: string;
  webmId: string;
  mp4Id: string;
  posterUrl: string;
  width: number;
  height: number;
  originalBytes: number;
  convertedBytes: number;
};

type GifUploadProps = {
  onConverted: (result: ConvertedFrame) => void;
};

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

/**
 * 拍貼框動畫的 GIF 上傳。
 *
 * 使用者只需準備一個 GIF，伺服器會轉成 WebM、MP4 與封面圖 ——
 * 讓使用者自備三個檔案太容易出錯，而 GIF 直接上站會讓首頁多載入數十 MB。
 */
export default function GifUpload({ onConverted }: GifUploadProps) {
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // objectURL 不釋放會一直佔著記憶體
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const accept = async (file: File | undefined) => {
    if (!file) return;

    if (file.type !== "image/gif") {
      setStatus("error");
      setMessage("請選擇 GIF 動圖檔");
      return;
    }

    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setStatus("working");
    setMessage("轉檔中，大的 GIF 可能需要十幾秒…");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/admin/upload-video", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(body.error ?? "上傳失敗");
        return;
      }

      const result: ConvertedFrame = await res.json();
      setStatus("idle");
      setMessage(
        `完成：${mb(result.originalBytes)}MB 的 GIF 已轉為 ${mb(result.convertedBytes)}MB 的影片`,
      );
      onConverted(result);
    } catch {
      setStatus("error");
      setMessage("連線失敗");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "working"}
        className="rounded-full bg-brand-mist px-4 py-2 text-caption text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-50"
      >
        {status === "working" ? "轉檔中…" : "上傳 GIF 更換動畫"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/gif"
        onChange={(event) => {
          void accept(event.target.files?.[0]);
          // 清空才能連續選同一個檔案
          event.target.value = "";
        }}
        className="hidden"
      />

      {preview && (
        <div className="flex items-center gap-2">
          {/* GIF 預覽用原生 img：next/image 會把它最佳化成靜態圖 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="h-16 w-auto rounded border border-black/10"
          />
          <span className="text-caption text-brand-ink/60">上傳的原始動圖</span>
        </div>
      )}

      {message && (
        <p
          className={`text-caption ${
            status === "error" ? "text-red-600" : "text-brand-ink/70"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
