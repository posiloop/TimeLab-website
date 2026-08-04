"use client";

import { useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // 用原生 <dialog> 取得焦點鎖定與 Esc 關閉，毋須自行實作
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        // 點擊背景（dialog 本身而非內容）時關閉
        if (event.target === dialogRef.current) onClose();
      }}
      aria-label={title}
      className="m-auto w-[1514px] max-w-[calc(100vw-2rem)] rounded-[20px] bg-white p-0 backdrop:bg-black/50"
    >
      <div className="relative max-h-[85vh] overflow-y-auto p-10 max-md:p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="關閉"
          className="absolute right-6 top-6 flex size-10 items-center justify-center rounded-full bg-brand-mist text-2xl leading-none text-brand-ink transition-colors hover:bg-brand hover:text-brand-mist"
        >
          ×
        </button>
        {children}
      </div>
    </dialog>
  );
}
