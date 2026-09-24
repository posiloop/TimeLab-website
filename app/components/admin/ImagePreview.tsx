"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type PreviewTarget = { src: string; caption?: string };

const PreviewContext = createContext<(target: PreviewTarget) => void>(() => {});

/** 在縮圖上呼叫，開啟放大預覽 */
export function useImagePreview() {
  return useContext(PreviewContext);
}

/**
 * 圖片放大預覽。
 *
 * 用原生 <dialog> 取得焦點鎖定與 Esc 關閉，與 app/components/Modal.tsx
 * 同一套做法，毋須自行實作。單一實例掛在後台外層，各頁的縮圖透過
 * useImagePreview() 觸發，避免每張縮圖都掛一個 dialog。
 */
export default function ImagePreviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [target, setTarget] = useState<PreviewTarget | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = useCallback((next: PreviewTarget) => setTarget(next), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (target && !dialog.open) dialog.showModal();
    else if (!target && dialog.open) dialog.close();
  }, [target]);

  return (
    <PreviewContext.Provider value={open}>
      {children}

      <dialog
        ref={dialogRef}
        onClose={() => setTarget(null)}
        onClick={(event) => {
          // 點背景（dialog 本身而非圖片）關閉
          if (event.target === dialogRef.current) setTarget(null);
        }}
        className="m-auto max-h-[90dvh] max-w-[90vw] bg-transparent p-0 backdrop:bg-black/70"
      >
        {target && (
          <div className="flex flex-col items-center gap-3">
            {/* 圖片來自 S3，且此處只是原尺寸預覽，用原生 img 即可 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={target.src}
              alt={target.caption ?? ""}
              className="max-h-[78dvh] max-w-[90vw] rounded-[8px] object-contain"
            />

            <div className="flex items-center gap-3">
              {target.caption && (
                <span className="rounded-full bg-black/60 px-3 py-1 text-caption text-white">
                  {target.caption}
                </span>
              )}
              <button
                type="button"
                onClick={() => setTarget(null)}
                className="rounded-full bg-white px-4 py-1 text-caption text-brand-ink transition-opacity hover:opacity-85"
              >
                關閉
              </button>
            </div>
          </div>
        )}
      </dialog>
    </PreviewContext.Provider>
  );
}

/**
 * 可點擊放大的縮圖。
 *
 * 用 <button> 而非在 <img> 上掛 onClick，鍵盤才能對焦與觸發。
 * 位在拖曳清單內時，dnd-kit 的 PointerSensor 設了 8px 位移門檻，
 * 單純點擊不會被判定成拖曳，兩者不衝突。
 */
export function PreviewableImage({
  src,
  caption,
  className = "",
  alt = "",
  style,
}: {
  src: string;
  caption?: string;
  className?: string;
  alt?: string;
  /** 套在縮圖本身，例如拍貼框的傾斜角預覽 */
  style?: React.CSSProperties;
}) {
  const open = useImagePreview();

  return (
    // 用 contents 讓這層按鈕不參與版面計算，圖片才是直接受容器約束的元素
    // —— 否則 className 裡的 max-h-full 會相對於按鈕而非外層容器，
    // 在限高的預覽框裡就會被裁掉上下緣
    <button
      type="button"
      onClick={() => open({ src, caption })}
      aria-label={caption ? `放大檢視 ${caption}` : "放大檢視"}
      className="group/preview contents cursor-zoom-in"
    >
      {/* 呼叫端的 className 放在後面，讓它能覆寫這裡的預設值 ——
          例如拍貼框的旋轉預覽需要自己的 transition-transform */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`cursor-zoom-in transition-opacity group-hover/preview:opacity-75 ${className}`}
        style={style}
      />
    </button>
  );
}
