"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PreviewableImage } from "@/app/components/admin/ImagePreview";
import UploadDropzone, {
  type UploadedAsset,
} from "@/app/components/admin/UploadDropzone";
import { updateCaseCategory, updateCategoryCover } from "../actions";

type Category = {
  id: string;
  slug: string;
  label: string;
  tagline: string;
  coverUrl: string;
  itemCount: number;
};

export default function CategoryCard({ category }: { category: Category }) {
  const router = useRouter();
  const [label, setLabel] = useState(category.label);
  const [tagline, setTagline] = useState(category.tagline);
  const [changingCover, setChangingCover] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const dirty = label !== category.label || tagline !== category.tagline;

  const save = () => {
    setError("");
    startTransition(async () => {
      const result = await updateCaseCategory({
        id: category.id,
        label,
        tagline,
      });
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  };

  const coverUploaded = (assets: UploadedAsset[]) => {
    const asset = assets[0];
    if (!asset) return;
    startTransition(async () => {
      const result = await updateCategoryCover(category.id, asset.id);
      if (!result.ok) return setError(result.error);
      setChangingCover(false);
      router.refresh();
    });
  };

  return (
    <div className="card-surface flex gap-4 rounded-[12px] p-4 max-md:flex-col">
      <div className="flex w-48 shrink-0 flex-col gap-2">
        <PreviewableImage
          src={category.coverUrl}
          caption={`${category.label} 分類封面`}
          className="h-28 w-full rounded-[8px] object-cover"
        />
        <button
          type="button"
          onClick={() => setChangingCover((prev) => !prev)}
          className="rounded-full bg-brand-mist px-3 py-1 text-caption text-brand transition-colors hover:bg-brand hover:text-white"
        >
          {changingCover ? "取消更換" : "更換封面圖"}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="w-32 rounded-[8px] border border-black/15 px-3 py-2 text-sm font-bold outline-none focus:border-brand"
          />
          <span className="rounded-full bg-brand-mist px-2 py-1 text-caption text-brand-ink/60">
            網址代號 {category.slug}
          </span>
        </div>

        <input
          value={tagline}
          onChange={(event) => setTagline(event.target.value)}
          placeholder="副標"
          className="rounded-[8px] border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        />

        {error && <p className="text-caption text-red-600">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/cases/${category.slug}`}
            className="flex items-center gap-1 rounded-full bg-brand px-4 py-2 text-caption font-bold text-white transition-opacity hover:opacity-85"
          >
            管理 {category.itemCount} 張案例照
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>

          {dirty && (
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="rounded-full border border-brand px-4 py-2 text-caption text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-50"
            >
              {pending ? "儲存中…" : "儲存文字變更"}
            </button>
          )}
        </div>

        {changingCover && (
          <UploadDropzone
            folder="case-covers"
            onUploaded={coverUploaded}
            multiple={false}
            expected={{ width: 606, height: 414 }}
          />
        )}
      </div>
    </div>
  );
}
