"use client";

import { Shuffle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { PreviewableImage } from "@/app/components/admin/ImagePreview";
import { useConfirm } from "@/app/components/admin/ConfirmDialog";
import SaveBar from "@/app/components/admin/SaveBar";
import { useToast } from "@/app/components/admin/Toast";
import SortableList from "@/app/components/admin/SortableList";
import UploadDropzone, {
  type UploadedAsset,
} from "@/app/components/admin/UploadDropzone";
import {
  addHeroSlide,
  removeHeroSlide,
  reorderHeroTrack,
  type CreatedHeroSlide,
} from "../actions";

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
  const toast = useToast();
  const confirmAction = useConfirm();
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
        if (!result.ok) {
          toast(result.error, "error");
          return setError(result.error);
        }
      }
      setBaseline(current);
      toast("已更新");
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
      const created: CreatedHeroSlide[] = [];

      for (const asset of assets) {
        // 一次加進三軌尾端：只加一軌的話另外兩排看不到變化，
        // 使用者會以為上傳失敗
        const result = await addHeroSlide(asset.id);
        if (!result.ok) {
          toast(result.error, "error");
          return setError(result.error);
        }
        created.push(...result.data);
      }

      // 併進兩份 —— 只加 current 會讓新相框被當成未儲存的排序變更。
      // 每張圖都建立了三筆（三軌各一），依 track 分派回各自那排
      const append = (prev: Record<TrackKey, Slide[]>) =>
        Object.fromEntries(
          trackKeys.map((key) => [
            key,
            [...prev[key], ...created.filter((s) => s.track === key)],
          ]),
        ) as Record<TrackKey, Slide[]>;
      setCurrent(append);
      setBaseline(append);

      toast(`已加入 ${assets.length} 張相框`);
      router.refresh();
    });
  };

  const removeFromLibrary = async (assetId: string, name: string) => {
    const usedIn = trackKeys.filter((key) =>
      current[key].some((s) => s.assetId === assetId),
    );
    const where = usedIn.map((k) => TRACK_LABEL[k]).join("、");

    const ok = await confirmAction({
      title: `刪除「${name}」？`,
      body: [
        `這張相框目前用在${where}，刪除後這幾排都會少一張。`,
        "刪除後無法復原。",
      ],
      confirmLabel: "刪除",
      danger: true,
    });
    if (!ok) return;

    startTransition(async () => {
      const ids = trackKeys.flatMap((key) =>
        current[key].filter((s) => s.assetId === assetId).map((s) => s.id),
      );
      for (const id of ids) {
        const result = await removeHeroSlide(id);
        if (!result.ok) {
          toast(result.error, "error");
          return setError(result.error);
        }
      }
      // 從兩份都移除 —— library 直接取自 props 會自己更新，
      // 但三軌是 state，不同步的話刪掉的相框還留在排列順序裡
      const drop = (prev: Record<TrackKey, Slide[]>) =>
        Object.fromEntries(
          trackKeys.map((key) => [
            key,
            prev[key].filter((s) => s.assetId !== assetId),
          ]),
        ) as Record<TrackKey, Slide[]>;
      setCurrent(drop);
      setBaseline(drop);

      toast(`已刪除「${name}」`);
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

        {/* 等寬網格而非 flex-wrap：後者的縮圖寬度固定，排完一列剩下的
            餘量會留成空白，右緣就與下方的上傳區對不齊 */}
        <ul className="grid grid-cols-8 gap-2 max-2xl:grid-cols-6 max-lg:grid-cols-4 max-md:grid-cols-3 max-[380px]:grid-cols-2">
          {library.map((item) => (
            <li
              key={item.id}
              className="group relative overflow-hidden rounded-[8px] border border-black/10 bg-white"
            >
              <PreviewableImage
                src={item.url}
                caption={item.name}
                // 相框是直式的，固定比例才不會在欄寬變動時忽高忽低
                className="aspect-[275/410] w-full object-cover"
              />
              <p className="truncate px-1 py-1 text-caption text-brand-ink/70">
                {item.name}
              </p>
              <button
                type="button"
                onClick={() => removeFromLibrary(item.id, item.name)}
                disabled={pending}
                aria-label={`刪除 ${item.name}`}
                // 觸控裝置沒有 hover，group-hover 的刪除鈕在手機永遠按不到，
                // 故手機一律常駐顯示並放大到好按的尺寸
                className="absolute right-1 top-1 hidden size-6 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-600 group-hover:grid disabled:opacity-50 max-md:grid max-md:size-8"
              >
                <X aria-hidden className="size-3.5" />
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-bold text-brand-ink">
                {TRACK_LABEL[key]}
                <span className="ml-2 text-caption font-normal text-brand-ink/60">
                  網站上{TRACK_DIRECTION[key]}
                </span>
              </span>
              <button
                type="button"
                onClick={() => shuffle(key)}
                className="flex items-center gap-1 rounded-full bg-brand-mist px-4 py-1 text-caption text-brand transition-colors hover:bg-brand hover:text-white max-md:py-2"
              >
                <Shuffle aria-hidden className="size-3.5" />
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
                // 這裡的縮圖只用來拖曳排序，不開放點擊放大 ——
                // 要看大圖在上方圖庫，同一張圖不必兩處都能點。
                // 游標也該維持 grab，被 zoom-in 蓋掉會讓人以為點了會放大
                <div className="w-16 cursor-grab max-md:w-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.url}
                    alt=""
                    className="h-24 w-full rounded-[6px] border border-black/10 object-cover max-md:h-28"
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
