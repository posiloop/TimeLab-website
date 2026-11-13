"use client";

import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PreviewableImage } from "@/app/components/admin/ImagePreview";
import { useConfirm } from "@/app/components/admin/ConfirmDialog";
import { useToast } from "@/app/components/admin/Toast";
import ToggleSwitch from "@/app/components/admin/ToggleSwitch";
import UploadDropzone, {
  type UploadedAsset,
} from "@/app/components/admin/UploadDropzone";
import { setHeroIntroImage, setHeroIntroImageMode } from "../actions";

type IntroImage = { id: string; url: string; name: string };

export default function HeroIntroEditor({
  intro,
}: {
  intro: { imageMode: boolean; image: IntroImage | null };
}) {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();
  const [imageMode, setImageMode] = useState(intro.imageMode);
  const [image, setImage] = useState<IntroImage | null>(intro.image);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // 開關開了卻沒有圖，首頁其實仍是預設外觀 —— 明白標出來，免得使用者
  // 以為打開就會變、卻看不到任何變化
  const liveButNoImage = imageMode && !image;

  const toggle = (next: boolean) => {
    setError("");
    setImageMode(next);
    startTransition(async () => {
      const result = await setHeroIntroImageMode(next);
      if (!result.ok) {
        setImageMode(!next);
        toast(result.error, "error");
        return setError(result.error);
      }
      toast(next ? "已切換成圖片模式" : "已切回預設（logo＋文字）");
      router.refresh();
    });
  };

  const uploaded = (assets: UploadedAsset[]) => {
    const asset = assets[0];
    if (!asset) return;
    setError("");
    startTransition(async () => {
      const result = await setHeroIntroImage(asset.id);
      if (!result.ok) {
        toast(result.error, "error");
        return setError(result.error);
      }
      setImage({ id: asset.id, url: asset.url, name: asset.name || "主視覺圖" });
      toast("已更新主視覺圖");
      router.refresh();
    });
  };

  const remove = async () => {
    const ok = await confirmAction({
      title: "移除主視覺圖？",
      body: ["移除後首頁左側會回到預設的 logo＋文字。圖片本身保留在圖庫裡。"],
      confirmLabel: "移除",
      danger: true,
    });
    if (!ok) return;
    setError("");
    startTransition(async () => {
      const result = await setHeroIntroImage(null);
      if (!result.ok) {
        toast(result.error, "error");
        return setError(result.error);
      }
      setImage(null);
      toast("已移除主視覺圖");
      router.refresh();
    });
  };

  return (
    <section className="card-surface flex flex-col gap-4 rounded-[12px] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-brand-ink">
            左側介紹區（圖片模式）
          </h2>
          <p className="mt-1 max-w-prose text-caption text-brand-ink/70">
            網站最上方左半邊，預設是 logo 加「時光研究室」文字。打開「圖片模式」
            後，整塊會換成你上傳的一張圖，方便做節日裝飾（例如 logo 加聖誕帽）。
            關掉就回到預設外觀。
          </p>
        </div>
        <ToggleSwitch
          checked={imageMode}
          onChange={toggle}
          label="圖片模式"
          disabled={pending}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-[8px] bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {liveButNoImage && (
        <p className="rounded-[8px] bg-amber-50 px-4 py-2 text-sm text-amber-700">
          圖片模式已開啟，但還沒上傳圖片，首頁目前仍顯示預設的 logo＋文字。
          上傳一張圖後就會生效。
        </p>
      )}

      {image ? (
        <div className="flex flex-wrap items-center gap-4">
          <PreviewableImage
            src={image.url}
            caption={image.name}
            className="h-28 w-44 rounded-[8px] border border-black/10 bg-white object-contain"
          />
          <div className="flex flex-col gap-2">
            <p className="text-caption text-brand-ink/70">
              目前的主視覺圖
              {!imageMode && "（圖片模式關閉中，首頁仍顯示預設外觀）"}
            </p>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="flex items-center gap-1 self-start rounded-full px-3 py-1 text-caption text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <Trash aria-hidden className="size-3.5" />
              移除圖片
            </button>
          </div>
        </div>
      ) : (
        <p className="text-caption text-brand-ink/60">
          還沒有主視覺圖。上傳一張即可（建議用去背或白底、構圖置中的圖；
          手機版會自動縮小）。
        </p>
      )}

      {/* 單張模式：同一欄位重傳即換圖。沿用 hero 資料夾，與三排相框同一個圖庫區 */}
      <UploadDropzone folder="hero" onUploaded={uploaded} multiple={false} />
    </section>
  );
}
