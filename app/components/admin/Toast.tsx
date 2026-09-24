"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type ToastKind = "success" | "error";
type Toast = { id: number; kind: ToastKind; message: string };

type ShowToast = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** 在任何後台元件裡呼叫，跳出短暫的提示 */
export function useToast() {
  return useContext(ToastContext);
}

/** 成功訊息 3 秒自動消失；錯誤留久一點，使用者需要時間讀完 */
const DURATION: Record<ToastKind, number> = {
  success: 3000,
  error: 6000,
};

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback<ShowToast>((message, kind = "success") => {
    // 用時間戳當 key，連續觸發也不會互相覆蓋
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), kind, message }]);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}

      {/* 固定在右下角，避開底部置中的未儲存提示列 */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2 max-md:bottom-24 max-md:left-4 max-md:right-4 max-md:items-stretch"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDone={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  // 先掛上再觸發進場動畫，否則元素一出現就已在最終位置
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const leave = setTimeout(() => setVisible(false), DURATION[toast.kind]);
    // 等淡出播完再從清單移除，直接 unmount 會讓它瞬間消失
    const remove = setTimeout(onDone, DURATION[toast.kind] + 400);

    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(leave);
      clearTimeout(remove);
    };
  }, [toast.kind, onDone]);

  const success = toast.kind === "success";
  const Icon = success ? CircleCheck : CircleAlert;

  return (
    <div
      role={success ? "status" : "alert"}
      className={`pointer-events-auto flex items-center gap-2 rounded-[10px] px-4 py-3 text-sm shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        success ? "bg-brand text-white" : "bg-red-600 text-white"
      } ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {toast.message}
    </div>
  );
}
