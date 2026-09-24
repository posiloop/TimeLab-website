"use client";

import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import GifUpload, {
  type ConvertedFrame,
} from "@/app/components/admin/GifUpload";
import { PreviewableImage } from "@/app/components/admin/ImagePreview";
import SaveBar from "@/app/components/admin/SaveBar";
import SortableList from "@/app/components/admin/SortableList";
import ToggleSwitch from "@/app/components/admin/ToggleSwitch";
import {
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
 * 保留得不夠，影片的四個角就會被容器裁掉。手算這個對使用者不合理，
 * 故提供一鍵計算。
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
        if (!result.ok) return setError(result.error);
      }

      if (orderChanged) {
        const result = await reorderFrames(list.map((f) => f.id));
        if (!result.ok) return setError(result.error);
      }

      setBaseline(list);
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
      });
      if (!saved.ok) return setError(saved.error);
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
        className="flex flex-col gap-3"
        renderItem={(frame) => (
          <div className="card-surface flex gap-4 rounded-[12px] p-4 max-md:flex-col">
            <div className="flex w-48 shrink-0 flex-col items-center gap-2">
              <GripVertical
                aria-hidden
                className="size-5 shrink-0 cursor-grab self-start text-brand"
              />
              {/* 即時套用旋轉角度：數字對使用者沒有意義，看到圖歪掉才有。
                  拍貼框是直式（610×910），高度給 240 才填得滿這欄的寬度；
                  給 160 的話 contain 後只剩 107px 寬，圖會小到看不清內容 */}
              <div className="flex h-60 w-full items-center justify-center">
                <PreviewableImage
                  src={frame.posterUrl}
                  caption={frame.alt}
                  style={{ rotate: `${frame.rotate}deg` }}
                  className="max-h-full max-w-full object-contain transition-transform duration-200"
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-caption text-brand-ink">
                  描述文字（給視障輔助工具朗讀）
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
                  min={-10}
                  max={10}
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

              <div className="flex flex-wrap items-end gap-3">
                <p className="text-caption text-brand-ink/60">
                  版面尺寸 {frame.displayWidth} × {frame.displayHeight}
                  　保留空間 {frame.boxWidth} × {frame.boxHeight}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    patch(
                      frame.id,
                      boundingBox(
                        frame.displayWidth,
                        frame.displayHeight,
                        frame.rotate,
                      ),
                    )
                  }
                  className="rounded-full bg-brand-mist px-3 py-1 text-caption text-brand transition-colors hover:bg-brand hover:text-white"
                >
                  重新計算保留空間
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-3">
                <ToggleSwitch
                  checked={frame.isVisible}
                  onChange={(next) => toggle(frame.id, next)}
                  label="顯示在網站上"
                  disabled={pending}
                />
                <GifUpload onConverted={replaceMedia(frame.id)} />
              </div>
            </div>
          </div>
        )}
      />

      <SaveBar
        count={changeCount}
        saving={pending}
        onSave={save}
        onCancel={() => setList(baseline)}
      />
    </div>
  );
}
