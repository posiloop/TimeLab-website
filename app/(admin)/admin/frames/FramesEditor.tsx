"use client";

import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import GifUpload, {
  type ConvertedFrame,
} from "@/app/components/admin/GifUpload";
import { useConfirm } from "@/app/components/admin/ConfirmDialog";
import { useImagePreview } from "@/app/components/admin/ImagePreview";
import SaveBar from "@/app/components/admin/SaveBar";
import { useToast } from "@/app/components/admin/Toast";
import SortableList, {
  DragHandleWithIndex,
} from "@/app/components/admin/SortableList";
import ToggleSwitch from "@/app/components/admin/ToggleSwitch";
import {
  createFrameAnimation,
  removeFrameAnimation,
  replaceFrameMedia,
  reorderFrames,
  toggleFrame,
  updateFrame,
} from "../actions";

type Frame = {
  id: string;
  slug: string;
  alt: string;
  posterUrl: string;
  webmUrl: string;
  mp4Url: string;
  gifUrl?: string;
  displayWidth: number;
  displayHeight: number;
  rotate: number;
  boxWidth: number;
  boxHeight: number;
  isVisible: boolean;
};

/**
 * 算出旋轉後的外接矩形。
 *
 * CSS 的 rotate 不會改變元素佔用的版面空間，所以要另外保留位置；
 * 保留得不夠，影片的四個角就會被容器裁掉。
 *
 * 這個值不出現在介面上 —— 它由傾斜角度唯一決定，改角度時自動重算即可，
 * 讓使用者看到兩個無法自行判斷的數字只會造成困惑。
 */
function boundingBox(width: number, height: number, degrees: number) {
  const rad = (Math.abs(degrees) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    boxWidth: Math.ceil(width * cos + height * sin),
    boxHeight: Math.ceil(width * sin + height * cos),
  };
}

export default function FramesEditor({ frames }: { frames: Frame[] }) {
  const router = useRouter();
  const toast = useToast();
  const preview = useImagePreview();
  const confirmAction = useConfirm();
  const [list, setList] = useState(frames);
  const [baseline, setBaseline] = useState(frames);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const orderChanged =
    list.map((f) => f.id).join() !== baseline.map((f) => f.id).join();

  const editedIds = list
    .filter((frame) => {
      const origin = baseline.find((b) => b.id === frame.id);
      if (!origin) return false;
      return (
        origin.alt !== frame.alt ||
        origin.rotate !== frame.rotate ||
        origin.boxWidth !== frame.boxWidth ||
        origin.boxHeight !== frame.boxHeight ||
        origin.displayWidth !== frame.displayWidth ||
        origin.displayHeight !== frame.displayHeight
      );
    })
    .map((frame) => frame.id);

  const changeCount = editedIds.length + (orderChanged ? 1 : 0);

  const patch = (id: string, change: Partial<Frame>) =>
    setList((prev) =>
      prev.map((frame) => (frame.id === id ? { ...frame, ...change } : frame)),
    );

  const save = () => {
    setError("");
    startTransition(async () => {
      for (const id of editedIds) {
        const frame = list.find((f) => f.id === id);
        if (!frame) continue;
        const result = await updateFrame({
          id,
          alt: frame.alt,
          displayWidth: frame.displayWidth,
          displayHeight: frame.displayHeight,
          rotate: frame.rotate,
          boxWidth: frame.boxWidth,
          boxHeight: frame.boxHeight,
        });
        if (!result.ok) {
          toast(result.error, "error");
          return setError(result.error);
        }
      }

      if (orderChanged) {
        const result = await reorderFrames(list.map((f) => f.id));
        if (!result.ok) {
          toast(result.error, "error");
          return setError(result.error);
        }
      }

      setBaseline(list);
      toast("已更新");
      router.refresh();
    });
  };

  const toggle = (id: string, isVisible: boolean) => {
    patch(id, { isVisible });
    setBaseline((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isVisible } : f)),
    );
    startTransition(async () => {
      const result = await toggleFrame(id, isVisible);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  };

  /** 換上新轉好的影片。三個檔案一起替換，不會出現只換了一半的狀態 */
  const replaceMedia = (id: string) => (result: ConvertedFrame) => {
    setError("");
    startTransition(async () => {
      const saved = await replaceFrameMedia(id, {
        posterId: result.posterId,
        webmId: result.webmId,
        mp4Id: result.mp4Id,
        gifId: result.gifId,
      });
      if (!saved.ok) {
        toast(saved.error, "error");
        return setError(saved.error);
      }

      // 同步兩份，畫面才會立刻換成新影片 —— router.refresh() 帶回的新
      // props 不會寫進已初始化的 state
      const swap = (prev: Frame[]) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                posterUrl: result.posterUrl,
                webmUrl: result.webmUrl,
                mp4Url: result.mp4Url,
                gifUrl: result.gifUrl,
              }
            : f,
        );
      setList(swap);
      setBaseline(swap);

      toast("動畫已更換");
      router.refresh();
    });
  };

  /** 上傳 GIF 新增一個拍貼框。描述文字先以檔名帶入，由使用者接著改 */
  const create = (result: ConvertedFrame) => {
    setError("");
    startTransition(async () => {
      const saved = await createFrameAnimation({
        alt: result.name || "新的拍貼框",
        posterId: result.posterId,
        webmId: result.webmId,
        mp4Id: result.mp4Id,
        gifId: result.gifId,
        width: result.width,
        height: result.height,
      });
      if (!saved.ok) {
        toast(saved.error, "error");
        return setError(saved.error);
      }

      setList((prev) => [...prev, saved.data]);
      setBaseline((prev) => [...prev, saved.data]);
      toast("已新增拍貼框");
      router.refresh();
    });
  };

  const remove = async (id: string, alt: string) => {
    const confirmed = await confirmAction({
      title: `刪除「${alt}」？`,
      body: [
        "這個拍貼框不會再出現在網站上，影片檔案也會一併刪除。",
        "刪除後無法復原。",
      ],
      confirmLabel: "刪除",
      danger: true,
    });
    if (!confirmed) return;

    startTransition(async () => {
      const result = await removeFrameAnimation(id);
      if (!result.ok) {
        toast(result.error, "error");
        return setError(result.error);
      }

      const drop = (prev: Frame[]) => prev.filter((f) => f.id !== id);
      setList(drop);
      setBaseline(drop);

      toast(`已刪除「${alt}」`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-h2 text-brand-ink">拍貼框動畫</h1>
        <p className="mt-1 text-sm text-brand-ink/70">
          網站中段會動的那排拍貼框。要更換動畫，直接上傳一個 GIF 即可，
          系統會自動轉成網頁播放用的格式（檔案會小很多，網站載入比較快）。
          傾斜角度可以調整，左側預覽會即時反映效果。
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-[8px] bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <SortableList
        items={list}
        getId={(frame) => frame.id}
        onReorder={setList}
        // 卡片內有滑桿、輸入框與按鈕，整片可拖會讓那些元件無法操作
        handleOnly
        className="flex flex-col gap-3"
        renderItem={(frame, index) => (
          <div className="card-surface flex gap-4 rounded-[12px] p-4 max-md:flex-col">
            {/* 手機堆疊時改成整列寬並置中 —— 固定 192px 會讓旋轉預覽
                偏在左側、右邊留一大塊空白。預覽框同時降低高度，
                免得手機上光是這張圖就佔掉半個螢幕 */}
            <div className="flex w-48 shrink-0 flex-col items-center gap-2 max-md:w-full">
              <DragHandleWithIndex index={index} className="self-start" />
              {/* 即時套用旋轉角度：數字對使用者沒有意義，看到圖歪掉才有。
                  容器留得比圖片大：最大傾斜 20° 時，直式圖旋轉後會往外佔到
                  約 1.45 倍寬、1.17 倍高，不留空間四角就會被裁掉 */}
              <div className="flex h-72 w-full items-center justify-center overflow-visible max-md:h-56">
                {/* 播放實際的影片而非封面圖 —— 這一頁的重點就是確認動畫內容，
                    靜態圖看不出動了什麼。poster 在影片載入前先頂著。
                    muted 是自動播放的前提，playsInline 避免 iOS 搶全螢幕。
                    外層 button 用 contents 不參與版面，影片才受 h-60 約束 */}
                <button
                  type="button"
                  onClick={() =>
                    preview({
                      src: frame.posterUrl,
                      caption: frame.alt,
                      video: { webm: frame.webmUrl, mp4: frame.mp4Url },
                      gif: frame.gifUrl,
                    })
                  }
                  aria-label={`放大檢視 ${frame.alt}`}
                  className="contents"
                >
                  <video
                    key={frame.webmUrl}
                    poster={frame.posterUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    aria-label={frame.alt}
                    style={{ rotate: `${frame.rotate}deg` }}
                    className="max-h-[197px] max-w-[132px] cursor-zoom-in object-contain transition-transform duration-200 hover:opacity-75"
                  >
                    <source src={frame.webmUrl} type="video/webm" />
                    <source src={frame.mp4Url} type="video/mp4" />
                  </video>
                </button>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-caption text-brand-ink">
                  描述文字
                </span>
                <input
                  value={frame.alt}
                  onChange={(event) =>
                    patch(frame.id, { alt: event.target.value })
                  }
                  className="rounded-[8px] border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="flex items-center justify-between text-caption text-brand-ink">
                  <span>傾斜角度</span>
                  <span className="tabular-nums">{frame.rotate}°</span>
                </span>
                <input
                  type="range"
                  min={-20}
                  max={20}
                  step={0.5}
                  value={frame.rotate}
                  onChange={(event) => {
                    const rotate = Number(event.target.value);
                    // 角度一改，保留空間也要跟著重算，否則四角會被裁掉
                    const box = boundingBox(
                      frame.displayWidth,
                      frame.displayHeight,
                      rotate,
                    );
                    patch(frame.id, { rotate, ...box });
                  }}
                  className="accent-brand"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-3">
                <ToggleSwitch
                  checked={frame.isVisible}
                  onChange={(next) => toggle(frame.id, next)}
                  label="顯示在網站上"
                  disabled={pending}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => remove(frame.id, frame.alt)}
                    disabled={pending}
                    className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-caption text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 max-md:py-2"
                  >
                    <Trash aria-hidden className="size-3.5" />
                    刪除
                  </button>
                  <GifUpload onConverted={replaceMedia(frame.id)} />
                </div>
              </div>
            </div>
          </div>
        )}
      />

      {/* 外層不再自己畫虛線框 —— dropzone 模式的 GifUpload 已經有了，
          兩層疊起來只會變成雙框 */}
      <section className="card-surface flex flex-col gap-2 rounded-[12px] p-4">
        <div>
          <h2 className="text-sm font-bold text-brand">新增一個拍貼框</h2>
          <p className="mt-1 text-caption text-brand-ink/70">
            上傳 GIF，系統會轉成網頁播放用的格式並加到最後面。
          </p>
        </div>
        <GifUpload
          onConverted={create}
          label="選擇 GIF"
          submitLabel="確認新增"
          dropzone
          multiple
        />
      </section>

      <SaveBar
        count={changeCount}
        saving={pending}
        onSave={save}
        onCancel={() => setList(baseline)}
      />
    </div>
  );
}
