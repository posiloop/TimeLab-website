"use client";

import { ImageUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type ConvertedFrame = {
  posterId: string;
  webmId: string;
  mp4Id: string;
  gifId: string;
  posterUrl: string;
  /** 去掉副檔名的原始檔名 */
  name: string;
  webmUrl: string;
  mp4Url: string;
  gifUrl: string;
  width: number;
  height: number;
  originalBytes: number;
  convertedBytes: number;
};

type GifUploadProps = {
  onConverted: (result: ConvertedFrame) => void;
  /** 選擇檔案的按鈕文字。預設是替換既有動畫的語意 */
  label?: string;
  /** 確認送出的按鈕文字 */
  submitLabel?: string;
  /**
   * true 時把選擇檔案的按鈕換成可拖放的區塊。給版面寬裕的地方用
   *（新增拍貼框）；卡片裡的「更換動畫」沒有那個空間，維持按鈕
   */
  dropzone?: boolean;
  /**
   * true 時可一次選多個 GIF，依序轉檔。更換既有動畫只會是一對一，
   * 故預設關閉
   */
  multiple?: boolean;
};

type PendingGif = {
  /** 供 React key 用，檔名可能重複 */
  uid: string;
  file: File;
  preview: string;
};

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

/**
 * 拍貼框動畫的 GIF 上傳。
 *
 * 使用者只需準備一個 GIF，伺服器會轉成 WebM、MP4 與封面圖 ——
 * 讓使用者自備三個檔案太容易出錯，而 GIF 直接上站會讓首頁多載入數十 MB。
 */
export default function GifUpload({
  onConverted,
  label = "上傳 GIF 更換動畫",
  submitLabel = "確認更換",
  dropzone = false,
  multiple = false,
}: GifUploadProps) {
  /** 選好但還沒送出的檔案 */
  const [pending, setPending] = useState<PendingGif[]>([]);
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // objectURL 不釋放會一直佔著記憶體。移除單筆與清空各自負責釋放自己的，
  // 這個 effect 只管元件卸載 —— 若讓它依賴清單內容，清單少一筆就會連
  // 還留著的那幾筆一起釋放掉，剩下的預覽圖全變空白
  const pendingRef = useRef<PendingGif[]>([]);

  // 寫 ref 放在 effect 裡而非 render 期間 —— React Compiler 會擋下後者，
  // 而這個值只給卸載時的 cleanup 讀，晚一個 tick 更新沒有影響
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    return () => {
      for (const item of pendingRef.current) URL.revokeObjectURL(item.preview);
    };
  }, []);

  const clear = () =>
    setPending((prev) => {
      for (const item of prev) URL.revokeObjectURL(item.preview);
      return [];
    });

  const drop = (uid: string) =>
    setPending((prev) => {
      const target = prev.find((item) => item.uid === uid);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.uid !== uid);
    });

  /**
   * 選好檔案只排進待傳清單，等使用者按下送出。
   *
   * 這裡的代價比一般圖片上傳高得多 —— GIF 動輒數十 MB，伺服器還要跑
   * ffmpeg 轉三種格式，十幾秒跑完才發現選錯檔案，對使用者是白等。
   */
  const accept = (files: FileList | File[] | null) => {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;

    const gifs = list.filter((file) => file.type === "image/gif");
    if (gifs.length === 0) {
      setStatus("error");
      setMessage("請選擇 GIF 動圖檔");
      return;
    }

    const prepared: PendingGif[] = (multiple ? gifs : gifs.slice(0, 1)).map(
      (file) => ({
        uid: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }),
    );

    setPending((prev) => {
      // 單檔模式取代既有的；多檔模式累加，讓使用者能分幾次挑完
      if (!multiple) {
        for (const item of prev) URL.revokeObjectURL(item.preview);
        return prepared;
      }
      return [...prev, ...prepared];
    });

    setStatus("idle");
    // 混了非 GIF 的檔案時說一聲，否則使用者會以為全部都排進去了
    const skipped = list.length - gifs.length;
    setMessage(skipped > 0 ? `已略過 ${skipped} 個非 GIF 檔案` : "");
  };

  /**
   * 依序送出，一次一個。
   *
   * 不平行發送：每個 GIF 在伺服器上要跑三次 ffmpeg 編碼，同時開五個
   * 就是十五個編碼程序在搶 CPU，會把整個網站拖垮。
   */
  const submit = async () => {
    const queue = pending;
    if (queue.length === 0) return;

    setStatus("working");

    for (const [index, item] of queue.entries()) {
      setMessage(
        queue.length > 1
          ? `轉檔中 ${index + 1}/${queue.length}：${item.file.name}`
          : "轉檔中，大的 GIF 可能需要十幾秒…",
      );

      const form = new FormData();
      form.append("file", item.file);

      try {
        const res = await fetch("/api/admin/upload-video", {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setStatus("error");
          // 失敗就停下，剩下的留在清單裡可以重試 —— 繼續往下傳
          // 多半只是重複同一個錯誤
          setMessage(`${item.file.name}：${body.error ?? "上傳失敗"}`);
          return;
        }

        const result: ConvertedFrame = await res.json();
        // 每傳完一個就交出去，使用者看得到清單一個一個長出來
        onConverted(result);
        drop(item.uid);
      } catch {
        setStatus("error");
        setMessage(`${item.file.name}：連線失敗`);
        return;
      }
    }

    setStatus("idle");
    // 不留成功訊息 —— 呼叫端會跳 toast，兩處說同一件事只是噪音
    setMessage("");
  };

  return (
    <div className="flex flex-col gap-2">
      {dropzone ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            if (status === "working") return;
            accept(event.dataTransfer.files);
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
            {pending.length > 0 && !multiple ? "換一個 GIF" : label}
          </span>
          <span className="text-caption text-brand-ink">
            把 GIF 拖到這裡，或點擊選擇檔案
            {multiple && "，可一次選多個"}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "working"}
          className="rounded-full bg-brand-mist px-4 py-2 text-caption text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-50"
        >
          {pending.length > 0 ? "重新選擇 GIF" : label}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/gif"
        multiple={multiple}
        onChange={(event) => {
          accept(event.target.files);
          // 清空才能連續選同一個檔案
          event.target.value = "";
        }}
        className="hidden"
      />

      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <ul className="flex flex-wrap gap-2">
            {pending.map((item) => (
              <li
                key={item.uid}
                className="flex items-center gap-2 rounded-[8px] border border-black/10 bg-white p-2"
              >
                {/* GIF 預覽用原生 img：next/image 會把它最佳化成靜態圖 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt=""
                  className="h-16 w-auto rounded border border-black/10"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="max-w-[10rem] truncate text-caption text-brand-ink">
                    {item.file.name}
                  </span>
                  <span className="text-caption text-brand-ink/60">
                    {mb(item.file.size)}MB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => drop(item.uid)}
                  disabled={status === "working"}
                  aria-label={`不要上傳 ${item.file.name}`}
                  className="shrink-0 self-start text-brand-ink/40 transition-colors hover:text-red-600 disabled:opacity-40"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void submit()}
              disabled={status === "working"}
              className="rounded-full bg-brand px-4 py-1 text-caption text-white transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {status === "working"
                ? "轉檔中…"
                : pending.length > 1
                  ? `${submitLabel} ${pending.length} 個`
                  : submitLabel}
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={status === "working"}
              className="rounded-full px-3 py-1 text-caption text-brand-ink/70 transition-colors hover:bg-black/5 disabled:opacity-50"
            >
              取消
            </button>
          </div>
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
