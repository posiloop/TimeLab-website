"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

type PasswordFieldProps = {
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
  minLength?: number;
  autoFocus?: boolean;
};

/**
 * 密碼欄位，附可視切換。
 *
 * 看不見自己打了什麼是密碼輸入最常見的挫折來源，尤其這裡要求 12 個字元
 * 以上，且「新密碼」與「再輸入一次」對不起來時只會得到一句錯誤訊息。
 *
 * 切換用 type 而非 -webkit-text-security：後者在非 WebKit 瀏覽器無效。
 * 切回隱藏時焦點留在輸入框，才不會打斷正在輸入的人。
 */
export default function PasswordField({
  label,
  name,
  autoComplete,
  required = false,
  minLength,
  autoFocus = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-caption text-brand-ink">
        {label}
      </label>

      {/* 相對定位讓按鈕疊在輸入框右側；輸入框右側留出按鈕的寬度，
          長密碼才不會被蓋住 */}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className="w-full rounded-[8px] border border-black/15 py-2 pl-3 pr-10 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          // tabIndex -1：Tab 應該直接走到下一個欄位，而不是停在這顆
          // 純視覺輔助的按鈕上
          tabIndex={-1}
          aria-label={visible ? "隱藏密碼" : "顯示密碼"}
          className="absolute right-0 top-0 grid h-full w-10 place-items-center text-brand-ink/40 transition-colors hover:text-brand-ink"
        >
          {visible ? (
            <EyeOff aria-hidden className="size-4" />
          ) : (
            <Eye aria-hidden className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
