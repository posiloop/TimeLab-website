"use client";

import { Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useConfirm } from "@/app/components/admin/ConfirmDialog";
import SaveBar from "@/app/components/admin/SaveBar";
import { useToast } from "@/app/components/admin/Toast";
import SortableList, {
  DragHandle,
} from "@/app/components/admin/SortableList";
import ToggleSwitch from "@/app/components/admin/ToggleSwitch";
import {
  createFaq,
  removeFaq,
  reorderFaq,
  toggleFaq,
  updateFaq,
} from "../actions";

type Item = {
  id: string;
  question: string;
  answer: string;
  isVisible: boolean;
};

export default function FaqEditor({ items }: { items: Item[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();
  const [list, setList] = useState(items);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  // 原始狀態留著，才能算出哪幾筆真的被改過，也才能取消
  const [baseline, setBaseline] = useState(items);

  const orderChanged =
    list.map((i) => i.id).join() !== baseline.map((i) => i.id).join();

  const editedIds = list
    .filter((item) => {
      const origin = baseline.find((b) => b.id === item.id);
      return (
        origin &&
        (origin.question !== item.question || origin.answer !== item.answer)
      );
    })
    .map((item) => item.id);

  const changeCount = editedIds.length + (orderChanged ? 1 : 0);

  const patch = (id: string, change: Partial<Item>) =>
    setList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...change } : item)),
    );

  const save = () => {
    setError("");
    startTransition(async () => {
      for (const id of editedIds) {
        const item = list.find((i) => i.id === id);
        if (!item) continue;
        const result = await updateFaq(id, {
          question: item.question,
          answer: item.answer,
        });
        if (!result.ok) return setError(result.error);
      }

      if (orderChanged) {
        const result = await reorderFaq(list.map((item) => item.id));
        if (!result.ok) return setError(result.error);
      }

      setBaseline(list);
      toast("已更新，網站上已經看得到了");
      router.refresh();
    });
  };

  const cancel = () => {
    setList(baseline);
    setError("");
  };

  // 顯示與隱藏立即生效：它是單一欄位的切換，沒有「改到一半」的狀態，
  // 放進未儲存清單反而讓使用者困惑
  const toggle = (id: string, isVisible: boolean) => {
    patch(id, { isVisible });
    setBaseline((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isVisible } : item)),
    );
    startTransition(async () => {
      const result = await toggleFaq(id, isVisible);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  };

  const add = (formData: FormData) => {
    setError("");
    startTransition(async () => {
      const result = await createFaq({
        question: String(formData.get("question") ?? ""),
        answer: String(formData.get("answer") ?? ""),
      });
      if (!result.ok) {
        toast(result.error, "error");
        return setError(result.error);
      }
      setAdding(false);
      toast("已新增問答");
      router.refresh();
    });
  };

  const remove = async (id: string, question: string) => {
    const ok = await confirmAction({
      title: "刪除這則問答？",
      body: [question, "刪除後無法復原。"],
      confirmLabel: "刪除",
      danger: true,
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await removeFaq(id);
      if (!result.ok) {
        toast(result.error, "error");
        return setError(result.error);
      }
      toast("已刪除");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-h2 text-brand-ink">常見問題</h1>
        <p className="mt-1 text-sm text-brand-ink/70">
          拖曳左側可調整順序。關閉「顯示」的問答不會出現在網站上，但資料仍保留。
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-[8px] bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <SortableList
        items={list}
        getId={(item) => item.id}
        onReorder={setList}
        // 項目內有問題與答案的輸入框，整片可拖會讓它們無法點選與編輯
        handleOnly
        className="flex flex-col gap-3"
        renderItem={(item) => (
          <div className="card-surface flex gap-3 rounded-[12px] p-4">
            <DragHandle className="mt-2" />

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <input
                value={item.question}
                onChange={(event) =>
                  patch(item.id, { question: event.target.value })
                }
                placeholder="問題"
                className="rounded-[8px] border border-black/15 px-3 py-2 text-sm font-bold outline-none focus:border-brand"
              />
              <textarea
                value={item.answer}
                onChange={(event) =>
                  patch(item.id, { answer: event.target.value })
                }
                placeholder="答案"
                rows={3}
                className="resize-y rounded-[8px] border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
              />

              <div className="flex items-center justify-between gap-3">
                <ToggleSwitch
                  checked={item.isVisible}
                  onChange={(next) => toggle(item.id, next)}
                  label="顯示在網站上"
                  disabled={pending}
                />
                <button
                  type="button"
                  onClick={() => remove(item.id, item.question)}
                  disabled={pending}
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-caption text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash aria-hidden className="size-3.5" />
                  刪除
                </button>
              </div>
            </div>
          </div>
        )}
      />

      {adding ? (
        <form action={add} className="card-surface flex flex-col gap-2 rounded-[12px] p-4">
          <input
            name="question"
            placeholder="問題"
            required
            className="rounded-[8px] border border-black/15 px-3 py-2 text-sm font-bold outline-none focus:border-brand"
          />
          <textarea
            name="answer"
            placeholder="答案"
            required
            rows={3}
            className="resize-y rounded-[8px] border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              新增
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-full px-4 py-2 text-sm text-brand-ink transition-colors hover:bg-brand-mist"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 self-start rounded-full border-2 border-dashed border-brand/40 px-5 py-2 text-sm text-brand transition-colors hover:border-brand hover:bg-white"
        >
          <Plus aria-hidden className="size-4" />
          新增問答
        </button>
      )}

      <SaveBar
        count={changeCount}
        saving={pending}
        onSave={save}
        onCancel={cancel}
      />
    </div>
  );
}
