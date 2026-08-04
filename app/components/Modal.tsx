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
      aria-labelledby="modal-title"
      className="m-auto w-[1514px] max-w-[calc(100vw-2rem)] rounded-[20px] bg-white p-0 backdrop:bg-black/50"
    >
      <div className="flex max-h-[90vh] flex-col">
        <h2
          id="modal-title"
          className="flex h-[100px] shrink-0 items-center justify-center rounded-t-[20px] bg-brand px-4 text-center text-h1 text-brand-mist [text-shadow:0_4px_4px_rgba(0,0,0,0.25)] max-md:h-[70px] max-md:text-2xl"
        >
          {title}
        </h2>

        <div className="overflow-y-auto px-10 py-6 max-md:px-5">{children}</div>

        <div className="shrink-0 pb-6 pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-[120px] rounded-full bg-brand-mist text-h2 tracking-[0.3em] text-brand-ink transition-colors hover:bg-brand hover:text-white"
          >
            關閉
          </button>
        </div>
      </div>
    </dialog>
  );
}
