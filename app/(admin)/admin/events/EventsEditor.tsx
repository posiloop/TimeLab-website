"use client";

import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PreviewableImage } from "@/app/components/admin/ImagePreview";
import SaveBar from "@/app/components/admin/SaveBar";
import { useToast } from "@/app/components/admin/Toast";
import SortableList from "@/app/components/admin/SortableList";
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
      toast("已更新，網站上已經看得到了");
      router.refresh();
    });
  };

  const uploaded = (track: TrackKey) => (assets: UploadedAsset[]) => {
    setError("");
    startTransition(async () => {
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
      }
      toast(`已加入 ${assets.length} 張照片`);
      router.refresh();
    });
  };

  const toggle = (id: string, isVisible: boolean) => {
    startTransition(async () => {
      const result = await toggleEventPhoto(id, isVisible);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  };

  const remove = (id: string, name: string) => {
    if (!confirm(`確定移除「${name}」？`)) return;
    startTransition(async () => {
      const result = await removeEventPhoto(id);
      if (!result.ok) {
        toast(result.error, "error");
        return setError(result.error);
      }
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
            className="flex flex-wrap gap-3"
            renderItem={(photo) => {
              // 版面寬與檔案比例算出來的寬不一致時要提醒 —— 這是版面歪掉
              // 最常見的原因，但不自動修正，改不改由使用者決定
              const fromFile = Math.round(
                (photo.intrinsicWidth / photo.intrinsicHeight) *
                  photo.displayHeight,
              );
              const drift = Math.abs(fromFile - photo.displayWidth) > 2;

              return (
                <div className="flex w-36 cursor-grab flex-col gap-1 rounded-[8px] border border-black/10 bg-white p-2">
                  <PreviewableImage
                    src={photo.url}
                    caption={`${photo.name}（${photo.intrinsicWidth} × ${photo.intrinsicHeight}）`}
                    className="h-24 w-full rounded object-cover"
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
                      className="flex items-center gap-1 rounded-full px-2 py-1 text-caption text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
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
