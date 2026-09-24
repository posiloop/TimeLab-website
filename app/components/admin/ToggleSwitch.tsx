"use client";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

/**
 * 顯示／隱藏開關。用原生 checkbox 加 peer 樣式，不引入 UI 套件 ——
 * 此 repo 既有的做法就是原生元素優先（Faq 用 details、Modal 用 dialog）。
 */
export default function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      {/* 軌道：未勾選為灰、勾選為品牌色。
          滑塊的位移寫成 [&>span] 而非 peer-checked:translate-x-4 ——
          peer-* 只作用於同層的兄弟元素，套在孫元素上不會生效 */}
      <span className="relative h-5 w-9 shrink-0 rounded-full bg-brand-ink/25 transition-colors duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] peer-checked:bg-brand peer-checked:[&>span]:translate-x-4 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand peer-disabled:opacity-40">
        <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]" />
      </span>
      <span className="text-caption text-brand-ink peer-disabled:opacity-40">
        {label}
      </span>
    </label>
  );
}
