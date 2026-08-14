"use client";

import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { label: "關於我們", href: "#about" },
  { label: "門市資訊", href: "#stores" },
  { label: "機台介紹", href: "#machines" },
  { label: "活動案例", href: "#cases" },
  { label: "租借流程", href: "#process" },
  { label: "方案內容", href: "#plans" },
  { label: "互惠合作", href: "#partnership" },
  { label: "聯絡我們", href: "#contact" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  // 選單展開時鎖住頁面捲動，並支援 Esc 關閉
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-(--header-h) bg-brand-mist shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
      <nav
        aria-label="主選單"
        className="flex h-full items-center justify-center px-4 max-lg:justify-end"
      >
        <ul className="flex items-center gap-[25px] max-xl:gap-2 max-lg:hidden">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="flex h-10 w-[120px] shrink-0 items-center justify-center rounded-full text-h2 text-brand-ink transition-colors hover:bg-brand hover:text-brand-mist max-xl:h-9 max-xl:w-auto max-xl:px-4 max-xl:text-base"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "關閉選單" : "開啟選單"}
          className="hidden size-11 items-center justify-center rounded-[10px] text-brand-ink transition-colors hover:bg-brand/10 max-lg:flex"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-7">
            {open ? (
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* 展開後的全螢幕選單，僅 lg 以下顯示 */}
      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-(--header-h) bottom-0 hidden overflow-y-auto bg-brand-mist max-lg:block"
        >
          <ul className="flex flex-col px-6 py-4">
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="border-b border-brand/20">
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-4 text-center text-h2 text-brand-ink transition-colors hover:text-brand"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
