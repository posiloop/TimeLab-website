"use client";

import { Download } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useToast } from "./Toast";

type PreviewTarget = {
  /** 圖片網址，或影片的封面圖 */
  src: string;
  caption?: string;
  /** 給定時放大顯示會播放的影片，而非靜態圖 */
  video?: { webm: string; mp4: string };
  /** 轉檔前的原始 GIF。只有在保留原檔之後上傳的拍貼框才有 */
  gif?: string;
  /**
   * true 時不顯示下載按鈕。給還沒上傳的本機檔案用 —— 圖片就在使用者
   * 自己電腦上，沒有下載的道理；而 objectURL 也推不出正確的副檔名
   */
  localOnly?: boolean;
};

const PreviewContext = createContext<(target: PreviewTarget) => void>(() => {});

/** 在縮圖上呼叫，開啟放大預覽 */
export function useImagePreview() {
  return useContext(PreviewContext);
}

/**
 * 從 caption 推出下載檔名。
 *
 * S3 的 key 是內容雜湊（a1b2c3….png），拿來當檔名使用者看不懂自己存了什麼，
 * 而 caption 多半就是上傳時的原檔名。但 caption 是給人看的說明，可能帶著
 * 括號註記（活動現場照的「roll-01.png（1200 × 800）」）或根本不是檔名
 *（分類封面的「婚禮 分類封面」），所以只取第一個空白/全形括號前的片段，
 * 再補上網址的副檔名 —— 副檔名必須來自網址，caption 不保證有或正確。
 */
function downloadName(url: string, caption?: string): string {
  const ext = new URL(url, "http://x").pathname.split(".").pop() ?? "";
  const fallback = ext ? `image.${ext}` : "image";
  if (!caption) return fallback;

  const base = caption
    .split(/[（(\s]/)[0]
    // Windows 與 macOS 都擋的字元，留著會讓瀏覽器自行改名或存檔失敗
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\.[^.]+$/, "");

  if (!base) return fallback;
  return ext ? `${base}.${ext}` : base;
}

/**
 * 下載遠端檔案。
 *
 * 不能只靠 <a download>：媒體檔在 S3／CloudFront 上是跨來源的，
 * 瀏覽器對跨來源連結一律忽略 download 屬性，結果變成開新分頁而非存檔。
 * 先抓成 blob 轉同源 object URL，download 才會生效。
 *
 * mode 與 cache 兩個選項缺一不可。頁面上的縮圖是 <img> 以 no-CORS 載入的，
 * 存進 HTTP 快取的那份副本不帶 CORS 標頭；之後的 fetch 命中同一份快取就會
 * 被判定跨來源失敗（TypeError: Failed to fetch），即使 S3 本身設定正確。
 * 媒體檔帶 max-age=31536000, immutable，這份副本不會自己過期，
 * 故明確要求重新發一次 CORS 請求，而非沿用 <img> 留下的。
 */
async function downloadFile(url: string, filename: string) {
  const response = await fetch(url, { mode: "cors", cache: "reload" });
  if (!response.ok) throw new Error(`下載失敗（${response.status}）`);

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
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
  const [downloading, setDownloading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();

  const open = useCallback((next: PreviewTarget) => setTarget(next), []);

  /** 下載期間鎖住按鈕：大的 MP4 會抓上幾秒，連點會存出重複檔案 */
  const download = async (url: string, caption?: string) => {
    setDownloading(true);
    try {
      await downloadFile(url, downloadName(url, caption));
    } catch (error) {
      // fetch 遭網路或 CORS 阻擋時拋的是 TypeError，訊息為瀏覽器原文的
      // 「Failed to fetch」，對使用者毫無意義，故只在自己拋的錯誤時照實顯示
      const message =
        error instanceof Error && !(error instanceof TypeError)
          ? error.message
          : "下載失敗，請檢查網路後再試";
      toast(message, "error");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (target && !dialog.open) dialog.showModal();
    else if (!target && dialog.open) dialog.close();
  }, [target]);

  // 先取出來，JSX 裡的 onClick 才不必用 non-null assertion 說服 TypeScript
  const video = target?.video;
  const gif = target?.gif;

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
        className="m-auto max-h-[90dvh] max-w-[90vw] bg-transparent p-0 backdrop:bg-black/70 max-md:max-h-[92dvh] max-md:max-w-[94vw]"
      >
        {target && (
          <div className="flex flex-col items-center gap-3">
            {video ? (
              // 影片放大後仍要能看出動畫內容，故同樣自動播放
              <video
                poster={target.src}
                autoPlay
                muted
                loop
                playsInline
                aria-label={target.caption}
                className="max-h-[78dvh] max-w-[90vw] rounded-[8px] object-contain max-md:max-h-[62dvh] max-md:max-w-[94vw]"
              >
                <source src={video.webm} type="video/webm" />
                <source src={video.mp4} type="video/mp4" />
              </video>
            ) : (
              /* 圖片來自 S3，且此處只是原尺寸預覽，用原生 img 即可 */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={target.src}
                alt={target.caption ?? ""}
                className="max-h-[78dvh] max-w-[90vw] rounded-[8px] object-contain max-md:max-h-[62dvh] max-md:max-w-[94vw]"
              />
            )}

            {/* 拍貼框的預覽最多帶三顆下載鈕加一顆關閉，手機排不進一列。
                改直向堆疊並各自全寬，比擠成四顆小藥丸好按得多 */}
            <div className="flex flex-wrap items-center justify-center gap-3 max-md:w-full max-md:flex-col max-md:items-stretch max-md:gap-2">
              {target.caption && (
                <span className="rounded-full bg-black/60 px-3 py-1 text-caption text-white max-md:text-center max-md:break-all">
                  {target.caption}
                </span>
              )}
              {/* 影片的預覽畫面同時有兩個可下載的東西，故分成兩顆說明白
                  各自存到什麼；純圖片只有一個來源，不必多此一問 */}
              {!target.localOnly && (
                <DownloadButton
                  label={video ? "下載封面圖" : "下載圖片"}
                  disabled={downloading}
                  onClick={() => download(target.src, target.caption)}
                />
              )}
              {video && (
                <DownloadButton
                  label="下載影片"
                  disabled={downloading}
                  onClick={() => download(video.mp4, target.caption)}
                />
              )}
              {gif && (
                <DownloadButton
                  label="下載原始 GIF"
                  disabled={downloading}
                  onClick={() => download(gif, target.caption)}
                />
              )}
              <button
                type="button"
                onClick={() => setTarget(null)}
                className="rounded-full bg-white px-4 py-1 text-caption text-brand-ink transition-opacity hover:opacity-85 max-md:py-3"
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

function DownloadButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1 text-caption text-brand-ink transition-opacity hover:opacity-85 disabled:opacity-50 max-md:justify-center max-md:py-3"
    >
      <Download aria-hidden className="size-3.5" />
      {label}
    </button>
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
  localOnly = false,
}: {
  src: string;
  caption?: string;
  className?: string;
  alt?: string;
  /** 套在縮圖本身，例如拍貼框的傾斜角預覽 */
  style?: React.CSSProperties;
  /** 見 PreviewTarget.localOnly */
  localOnly?: boolean;
}) {
  const open = useImagePreview();

  return (
    // 用 contents 讓這層按鈕不參與版面計算，圖片才是直接受容器約束的元素
    // —— 否則 className 裡的 max-h-full 會相對於按鈕而非外層容器，
    // 在限高的預覽框裡就會被裁掉上下緣
    <button
      type="button"
      onClick={() => open({ src, caption, localOnly })}
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
