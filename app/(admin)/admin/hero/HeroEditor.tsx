"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { PreviewableImage } from "@/app/components/admin/ImagePreview";
import SaveBar from "@/app/components/admin/SaveBar";
import SortableList from "@/app/components/admin/SortableList";
import UploadDropzone, {
  type UploadedAsset,
} from "@/app/components/admin/UploadDropzone";
import { addHeroSlide, removeHeroSlide, reorderHeroTrack } from "../actions";

type Slide = {
  id: string;
  assetId: string;
  url: string;
  name: string;
  isVisible: boolean;
  displayWidth: number;
  displayHeight: number;
};

type LibraryItem = {
  id: string;
  url: string;
  name: string;
  width: number;
  height: number;
};

type TrackKey = "TRACK_1" | "TRACK_2" | "TRACK_3";

const TRACK_LABEL: Record<TrackKey, string> = {
  TRACK_1: "第一排",
  TRACK_2: "第二排",
  TRACK_3: "第三排",
};

/** 三軌在網站上的實際捲動方向，標在標題旁讓使用者對得起來 */
const TRACK_DIRECTION: Record<TrackKey, string> = {
  TRACK_1: "向右捲動",
  TRACK_2: "向左捲動",
  TRACK_3: "向右捲動",
};

export default function HeroEditor({
  library,
  tracks,
}: {
  library: LibraryItem[];
  tracks: Record<TrackKey, Slide[]>;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(tracks);
  const [baseline, setBaseline] = useState(tracks);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const trackKeys = Object.keys(TRACK_LABEL) as TrackKey[];

  const changedTracks = trackKeys.filter(
    (key) =>
      current[key].map((s) => s.id).join() !==
      baseline[key].map((s) => s.id).join(),
  );

  const save = () => {
    setError("");
    startTransition(async () => {
      for (const key of changedTracks) {
        const result = await reorderHeroTrack(current[key].map((s) => s.id));
        if (!result.ok) return setError(result.error);
      }
      setBaseline(current);
      router.refresh();
    });
  };

  /** 打亂單一軌。設計稿的三組順序本來就是為了讓三排不同步而錯開的，
      給一顆按鈕比讓使用者手動拖十幾次務實得多。
      包在 useCallback 裡是為了讓 React Compiler 確定亂數只在事件中求值，
      不會在 render 期間被呼叫 */
  const shuffle = useCallback((key: TrackKey) => {
    setCurrent((prev) => {
      const next = [...prev[key]];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return { ...prev, [key]: next };
    });
  }, []);

  const uploaded = (assets: UploadedAsset[]) => {
    setError("");
    startTransition(async () => {
      for (const asset of assets) {
        // 一次加進三軌尾端：只加一軌的話另外兩排看不到變化，
        // 使用者會以為上傳失敗
        const result = await addHeroSlide(asset.id);
        if (!result.ok) return setError(result.error);
      }
      router.refresh();
    });
  };

  const removeFromLibrary = (assetId: string, name: string) => {
    const usedIn = trackKeys.filter((key) =>
      current[key].some((s) => s.assetId === assetId),
    );
    const where = usedIn.map((k) => TRACK_LABEL[k]).join("、");
    if (
      !confirm(
        `「${name}」目前用在${where}。刪除後這三排都會少一張，確定嗎？`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const ids = trackKeys.flatMap((key) =>
        current[key].filter((s) => s.assetId === assetId).map((s) => s.id),
      );
      for (const id of ids) {
        const result = await removeHeroSlide(id);
        if (!result.ok) return setError(result.error);
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 text-brand-ink">首頁主視覺</h1>
        <p className="mt-1 text-sm text-brand-ink/70">
          網站最上方傾斜的三排相框。三排共用同一組圖片，但各自有不同的排列順序，
          這樣三排才不會整齊劃一地一起移動。
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-[8px] bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-brand">
          圖庫 —— 三排共用的 {library.length} 張相框
        </h2>

        <ul className="flex flex-wrap gap-2">
          {library.map((item) => (
            <li
              key={item.id}
              className="group relative w-24 overflow-hidden rounded-[8px] border border-black/10 bg-white"
            >
              <PreviewableImage
                src={item.url}
                caption={item.name}
                className="h-32 w-full object-cover"
              />
              <p className="truncate px-1 py-1 text-caption text-brand-ink/70">
                {item.name}
              </p>
              <button
                type="button"
                onClick={() => removeFromLibrary(item.id, item.name)}
                disabled={pending}
                aria-label={`刪除 ${item.name}`}
                className="absolute right-1 top-1 hidden size-6 rounded-full bg-black/60 text-white transition-colors hover:bg-red-600 group-hover:block disabled:opacity-50"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <UploadDropzone folder="hero" onUploaded={uploaded} />
        <p className="text-caption text-brand-ink/60">
          新上傳的相框會自動加到三排的最後面。網站上一律以 275 × 410
          的比例呈現，這樣相框之間才能維持等距。
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-brand">排列順序</h2>

        {trackKeys.map((key) => (
          <div
            key={key}
            className="card-surface flex flex-col gap-2 rounded-[12px] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-brand-ink">
                {TRACK_LABEL[key]}
                <span className="ml-2 text-caption font-normal text-brand-ink/60">
                  網站上{TRACK_DIRECTION[key]}
                </span>
              </span>
              <button
                type="button"
                onClick={() => shuffle(key)}
                className="rounded-full bg-brand-mist px-4 py-1 text-caption text-brand transition-colors hover:bg-brand hover:text-white"
              >
                打亂順序
              </button>
            </div>

            {/* 水平排列直接對應「輪播是水平的」，用直式清單會讓使用者
                得在腦中做 90 度轉換 */}
            <SortableList
              items={current[key]}
              getId={(slide) => slide.id}
              onReorder={(next) => setCurrent({ ...current, [key]: next })}
              direction="horizontal"
              className="flex flex-wrap gap-2"
              renderItem={(slide, index) => (
                <div className="w-16 cursor-grab">
                  <PreviewableImage
                    src={slide.url}
                    caption={slide.name}
                    className="h-24 w-full rounded-[6px] border border-black/10 object-cover"
                  />
                  <p className="text-center text-caption text-brand-ink/50">
                    {index + 1}
                  </p>
                </div>
              )}
            />
          </div>
        ))}
      </section>

      <SaveBar
        count={changedTracks.length}
        saving={pending}
        onSave={save}
        onCancel={() => setCurrent(baseline)}
      />
    </div>
  );
}
