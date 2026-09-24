"use client";

import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PreviewableImage } from "@/app/components/admin/ImagePreview";
import { useConfirm } from "@/app/components/admin/ConfirmDialog";
import SaveBar from "@/app/components/admin/SaveBar";
import { useToast } from "@/app/components/admin/Toast";
import SortableList, {
  DragHandleWithIndex,
} from "@/app/components/admin/SortableList";
import ToggleSwitch from "@/app/components/admin/ToggleSwitch";
import UploadDropzone, {
  type UploadedAsset,
} from "@/app/components/admin/UploadDropzone";
import {
  addEventPhoto,
  removeEventPhoto,
  reorderEventTrack,
  toggleEventPhoto,
} from "../actions";

type Photo = {
  id: string;
  url: string;
  name: string;
  isVisible: boolean;
  displayWidth: number;
  displayHeight: number;
  intrinsicWidth: number;
  intrinsicHeight: number;
};

type TrackKey = "TRACK_1" | "TRACK_2" | "TRACK_3";

const TRACK_LABEL: Record<TrackKey, string> = {
  TRACK_1: "第一排",
  TRACK_2: "第二排",
  TRACK_3: "第三排",
};

/** 網站上三排的顯示高度一致，寬度則由每張圖自己的比例決定 */
const DISPLAY_HEIGHT = 760;

export default function EventsEditor({
  tracks,
}: {
  tracks: Record<TrackKey, Photo[]>;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();
  const [current, setCurrent] = useState(tracks);
  const [baseline, setBaseline] = useState(tracks);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const trackKeys = Object.keys(TRACK_LABEL) as TrackKey[];

  const changedTracks = trackKeys.filter(
    (key) =>
      current[key].map((p) => p.id).join() !==
      baseline[key].map((p) => p.id).join(),
  );

  const save = () => {
    setError("");
    startTransition(async () => {
      for (const key of changedTracks) {
        const result = await reorderEventTrack(current[key].map((p) => p.id));
        if (!result.ok) return setError(result.error);
      }
      setBaseline(current);
      toast("已更新");
      router.refresh();
    });
  };

  const uploaded = (track: TrackKey) => (assets: UploadedAsset[]) => {
    setError("");
    startTransition(async () => {
      const created: Photo[] = [];

      for (const asset of assets) {
        // 這一區的版面寬度直接取檔案實際寬度 —— 三排的圖本來就寬窄不一，
        // 高度統一 760，寬度照比例縮放
        const width = Math.round((asset.width / asset.height) * DISPLAY_HEIGHT);
        const result = await addEventPhoto({
          assetId: asset.id,
          track,
          displayWidth: width,
          displayHeight: DISPLAY_HEIGHT,
        });
        if (!result.ok) {
          toast(result.error, "error");
          return setError(result.error);
        }
        created.push(result.data);
      }

      // 併進兩份 —— 只加 current 會讓新照片被當成未儲存的排序變更
      const append = (prev: Record<TrackKey, Photo[]>) => ({
        ...prev,
        [track]: [...prev[track], ...created],
      });
      setCurrent(append);
      setBaseline(append);

      toast(`已加入 ${assets.length} 張照片`);
      router.refresh();
    });
  };

  const toggle = (id: string, isVisible: boolean) => {
    const apply = (prev: Record<TrackKey, Photo[]>) =>
      Object.fromEntries(
        trackKeys.map((key) => [
          key,
          prev[key].map((photo) =>
            photo.id === id ? { ...photo, isVisible } : photo,
          ),
        ]),
      ) as Record<TrackKey, Photo[]>;
    setCurrent(apply);
    setBaseline(apply);

    startTransition(async () => {
      const result = await toggleEventPhoto(id, isVisible);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  };

  const remove = async (id: string, name: string) => {
    const ok = await confirmAction({
      title: `移除「${name}」？`,
      body: ["這張照片不會再出現在網站上。"],
      confirmLabel: "移除",
      danger: true,
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await removeEventPhoto(id);
      if (!result.ok) {
        toast(result.error, "error");
        return setError(result.error);
      }

      const drop = (prev: Record<TrackKey, Photo[]>) =>
        Object.fromEntries(
          trackKeys.map((key) => [
            key,
            prev[key].filter((photo) => photo.id !== id),
          ]),
        ) as Record<TrackKey, Photo[]>;
      setCurrent(drop);
      setBaseline(drop);

      toast(`已移除「${name}」`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 text-brand-ink">活動現場照</h1>
        <p className="mt-1 text-sm text-brand-ink/70">
          網站最下方的三排現場照片。三排各有自己的照片，不像主視覺那樣共用。
          每張照片的寬度不同是正常的，網站會把高度統一成 {DISPLAY_HEIGHT}，
          寬度照原本的比例縮放。
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-[8px] bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {trackKeys.map((key) => (
        <section
          key={key}
          className="card-surface flex flex-col gap-3 rounded-[12px] p-4"
        >
          <h2 className="text-sm font-bold text-brand-ink">
            {TRACK_LABEL[key]}
            <span className="ml-2 text-caption font-normal text-brand-ink/60">
              {current[key].length} 張
            </span>
          </h2>

          <SortableList
            items={current[key]}
            getId={(photo) => photo.id}
            onReorder={(next) => setCurrent({ ...current, [key]: next })}
            direction="grid"
            // 卡片裡有顯示開關與移除鈕，整片可拖會蓋掉它們的點擊
            handleOnly
            // 等寬網格而非 flex-wrap：後者的卡片寬度固定，排完一列剩下的
            // 餘量會留成空白，右緣就與上傳區對不齊
            className="grid grid-cols-7 gap-3 max-2xl:grid-cols-5 max-lg:grid-cols-3 max-md:grid-cols-2"
            renderItem={(photo, index) => {
              // 版面寬與檔案比例算出來的寬不一致時要提醒 —— 這是版面歪掉
              // 最常見的原因，但不自動修正，改不改由使用者決定
              const fromFile = Math.round(
                (photo.intrinsicWidth / photo.intrinsicHeight) *
                  photo.displayHeight,
              );
              const drift = Math.abs(fromFile - photo.displayWidth) > 2;

              return (
                <div className="flex flex-col gap-1 rounded-[8px] border border-black/10 bg-white p-2">
                  <DragHandleWithIndex index={index} className="self-start" />
                  <PreviewableImage
                    src={photo.url}
                    caption={`${photo.name}（${photo.intrinsicWidth} × ${photo.intrinsicHeight}）`}
                    // 固定比例而非固定高：欄寬隨視窗變動，固定高會讓寬欄位
                    // 裁掉更多畫面。4:3 與這區照片的常見比例接近
                    className="aspect-[4/3] w-full rounded object-cover"
                  />
                  <p className="truncate text-caption text-brand-ink/70">
                    {photo.name}
                  </p>
                  <p className="text-caption text-brand-ink">
                    版面 {photo.displayWidth} × {photo.displayHeight}
                  </p>
                  {drift && (
                    <p className="text-caption text-amber-600">
                      照比例應為 {fromFile}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-1">
                    <ToggleSwitch
                      checked={photo.isVisible}
                      onChange={(next) => toggle(photo.id, next)}
                      label="顯示"
                      disabled={pending}
                    />
                    <button
                      type="button"
                      onClick={() => remove(photo.id, photo.name)}
                      disabled={pending}
                      className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-caption text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash aria-hidden className="size-3.5" />
                      移除
                    </button>
                  </div>
                </div>
              );
            }}
          />

          <UploadDropzone
            folder="event"
            onUploaded={uploaded(key)}
            expected={{ height: DISPLAY_HEIGHT }}
          />
        </section>
      ))}

      <SaveBar
        count={changedTracks.length}
        saving={pending}
        onSave={save}
        onCancel={() => setCurrent(baseline)}
      />
    </div>
  );
}
