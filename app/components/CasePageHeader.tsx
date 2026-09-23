"use client";

import Image from "next/image";
import Link from "next/link";
import type { CaseCategoryView } from "../server/content/cases";

type Props = {
  /** 由 CasesView 從伺服器端取得後傳入；此元件是 client，不能自己查資料庫 */
  categories: CaseCategoryView[];
  /** 目前所在分類的 slug */
  current: string;
  onSelect: (slug: string) => void;
};

/** 案例頁的頁首：LOGO + 五個分類 tab（設計稿 Header 1 / 1:5851） */
export default function CasePageHeader({
  categories,
  current,
  onSelect,
}: Props) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-(--header-h) bg-brand-mist">
      <div className="flex h-full items-center justify-between px-16 max-xl:px-8 max-md:flex-col max-md:justify-center max-md:gap-4 max-md:px-4">
        {/* 從案例頁回到首頁時停在活動案例區塊，而非頁面頂端 */}
        <Link href="/#cases" aria-label="回到首頁的活動案例">
          <Image
            src="/images/brand/logo-wide.png"
            alt="時光研究室 TiMELAB"
            width={128}
            height={25}
            priority
            className="h-[25px] w-[128px] object-contain"
          />
        </Link>

        <nav aria-label="案例分類">
          <ul className="flex items-center gap-6 max-md:gap-4">
            {categories.map((item) => (
              <li key={item.id}>
                {/* 所在分類維持與 hover 相同的外觀：底線加滿版不透明度 */}
                <button
                  type="button"
                  onClick={() => onSelect(item.slug)}
                  aria-current={item.slug === current ? "page" : undefined}
                  className="group/nav block cursor-pointer border-b-2 border-transparent text-body text-brand-ink transition-colors hover:border-brand-ink aria-[current=page]:border-brand-ink"
                >
                  <span className="opacity-70 transition-opacity group-hover/nav:opacity-100 group-aria-[current=page]/nav:opacity-100">
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
