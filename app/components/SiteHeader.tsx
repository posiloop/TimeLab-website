"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { NAV_ITEMS } from "../data/nav";

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
    <header className="fixed inset-x-0 top-0 z-50 bg-brand-mist">
      <nav
        aria-label="主選單"
        className="flex h-(--header-h) items-center justify-between px-16 max-xl:px-8 max-lg:px-4 max-md:px-16"
      >
        <a href="#top" aria-label="時光研究室 TiMELAB">
          <Image
            src="/images/brand/logo-wide.png"
            alt="時光研究室 TiMELAB"
            width={128}
            height={25}
            priority
            className="h-[25px] w-[128px] object-contain"
          />
        </a>

        <ul className="flex items-center gap-6 max-xl:gap-4 max-lg:grid max-lg:grid-cols-4 max-lg:gap-x-6 max-lg:gap-y-[10px] max-md:hidden">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="group/nav border-b-2 border-transparent text-body text-brand-ink transition-colors hover:border-brand-ink"
              >
                <span className="opacity-70 transition-opacity group-hover/nav:opacity-100">
                  {item.label}
                </span>
              </a>
            </li>
          ))}
        </ul>

        {/* 漢堡／關閉鈕 —— 設計稿 30×30，橫槓左右內縮 6px、高 2px */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "關閉選單" : "開啟選單"}
          className="relative hidden size-[30px] shrink-0 text-brand-ink max-md:block"
        >
          <span
            className={`absolute inset-x-[6px] h-[2px] rounded-full bg-current transition-transform duration-200 ${
              open ? "top-[14px] rotate-45" : "top-[9px]"
            }`}
          />
          <span
            className={`absolute inset-x-[6px] top-[14px] h-[2px] rounded-full bg-current transition-opacity duration-200 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute inset-x-[6px] h-[2px] rounded-full bg-current transition-transform duration-200 ${
              open ? "top-[14px] -rotate-45" : "top-[19px]"
            }`}
          />
        </button>
      </nav>

      {/* 展開後的面板 —— 貼齊頁首下方，項目右對齊，僅 md 以下顯示 */}
      {open && (
        <div
          id="mobile-menu"
          className="hidden bg-brand-mist px-16 pb-6 max-md:block"
        >
          <ul className="flex flex-col items-end gap-[10px]">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block text-body text-brand-ink opacity-70 transition-opacity hover:opacity-100"
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
