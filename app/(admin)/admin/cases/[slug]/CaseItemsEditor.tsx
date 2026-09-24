"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PreviewableImage } from "@/app/components/admin/ImagePreview";
import SaveBar from "@/app/components/admin/SaveBar";
import SortableList from "@/app/components/admin/SortableList";
import ToggleSwitch from "@/app/components/admin/ToggleSwitch";
import UploadDropzone, {
  type UploadedAsset,
} from "@/app/components/admin/UploadDropzone";
import {
  addCaseItem,
  removeCaseItem,
  reorderCaseItems,
  toggleCaseItem,
  updateCaseItemName,
} from "../../actions";

type Item = {
  id: string;
  name: string;
  isVisible: boolean;
  url: string;
};

export default function CaseItemsEditor({
  category,
  items,
}: {
  category: { id: string; slug: string; label: string };
  items: Item[];
}) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [baseline, setBaseline] = useState(items);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const orderChanged =
    list.map((i) => i.id).join() !== baseline.map((i) => i.id).join();

  const renamedIds = list
    .filter((item) => {
      const origin = baseline.find((b) => b.id === item.id);
      return origin && origin.name !== item.name;
    })
    .map((item) => item.id);

  const changeCount = renamedIds.length + (orderChanged ? 1 : 0);

  const save = () => {
    setError("");
    startTransition(async () => {
      for (const id of renamedIds) {
        const item = list.find((i) => i.id === id);
        if (!item) continue;
        const result = await updateCaseItemName(id, item.name);
        if (!result.ok) return setError(result.error);
      }

      if (orderChanged) {
        const result = await reorderCaseItems(list.map((i) => i.id));
        if (!result.ok) return setError(result.error);
      }

      setBaseline(list);
      router.refresh();
    });
  };

  const uploaded = (assets: UploadedAsset[]) => {
    setError("");
    startTransition(async () => {
      for (const asset of assets) {
        // 名稱先以檔名帶入，下面的清單會把「看起來還沒改過」的標成待補
        const result = await addCaseItem({
          categoryId: category.id,
          assetId: asset.id,
          name: "待補寫",
        });
        if (!result.ok) return setError(result.error);
      }
      router.refresh();
    });
  };

  const toggle = (id: string, isVisible: boolean) => {
    startTransition(async () => {
      const result = await toggleCaseItem(id, isVisible);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  };

  const remove = (id: string, name: string) => {
    if (!confirm(`確定移除「${name}」？`)) return;
    startTransition(async () => {
      const result = await removeCaseItem(id);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  };

  const todo = list.filter((item) => item.name === "待補寫").length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/admin/cases"
          className="text-caption text-brand hover:underline"
        >
          ← 回分類列表
        </Link>
        <h1 className="mt-1 text-h2 text-brand-ink">
          【{category.label}】案例照片
        </h1>
        <p className="mt-1 text-sm text-brand-ink/70">
          共 {list.length} 張。名稱的慣用格式是「機型 - 案例名」，
          例如「標準 - 籃球隊」。
        </p>
      </div>

      {todo > 0 && (
        <p className="rounded-[8px] bg-amber-50 px-4 py-2 text-sm text-amber-700">
          有 {todo} 張照片的名稱還沒填寫。
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-[8px] bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <SortableList
        items={list}
        getId={(item) => item.id}
        onReorder={setList}
        direction="grid"
        className="grid grid-cols-4 gap-3 max-lg:grid-cols-3 max-md:grid-cols-2"
        renderItem={(item) => (
          <div className="flex cursor-grab flex-col gap-2 rounded-[10px] border border-black/10 bg-white p-2">
            <PreviewableImage
              src={item.url}
              caption={item.name}
              className="aspect-[600/424] w-full rounded object-cover"
            />

            <input
              value={item.name}
              onChange={(event) =>
                setList((prev) =>
                  prev.map((i) =>
                    i.id === item.id ? { ...i, name: event.target.value } : i,
                  ),
                )
              }
              placeholder="機型 - 案例名"
              className={`rounded-[6px] border px-2 py-1 text-caption outline-none focus:border-brand ${
                item.name === "待補寫"
                  ? "border-amber-400 bg-amber-50"
                  : "border-black/15"
              }`}
            />

            <div className="flex items-center justify-between gap-1">
              <ToggleSwitch
                checked={item.isVisible}
                onChange={(next) => toggle(item.id, next)}
                label="顯示"
                disabled={pending}
              />
              <button
                type="button"
                onClick={() => remove(item.id, item.name)}
                disabled={pending}
                className="rounded-full px-2 py-1 text-caption text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                移除
              </button>
            </div>
          </div>
        )}
      />

      <UploadDropzone
        folder="cases"
        onUploaded={uploaded}
        expected={{ width: 960, height: 679 }}
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
