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
    <header className="fixed inset-x-0 top-0 z-50 h-(--header-h) bg-brand-mist">
      <nav
        aria-label="主選單"
        className="flex h-full items-center justify-between px-16 max-xl:px-8 max-lg:px-4"
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

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "關閉選單" : "開啟選單"}
          className="hidden size-11 items-center justify-center rounded-[10px] text-brand-ink transition-colors hover:bg-brand/10 max-md:flex"
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
          className="fixed inset-x-0 bottom-0 top-(--header-h) hidden overflow-y-auto bg-brand-mist max-md:block"
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
