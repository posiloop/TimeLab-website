"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import CasePageHeader from "../components/CasePageHeader";
import SiteFooter from "../components/SiteFooter";
import type {
  CaseCategoryView,
  CaseItemView,
} from "../server/content/cases";

type CasesViewProps = {
  categories: CaseCategoryView[];
  itemsBySlug: Record<string, CaseItemView[]>;
};

export default function CasesView({
  categories,
  itemsBySlug,
}: CasesViewProps) {
  // 預設分類改由 props 決定，不能再是模組層級的常數 ——
  // 資料現在來自資料庫，模組載入時還取不到
  const [currentSlug, setCurrentSlug] = useState(categories[0]?.slug ?? "");

  // 首頁的分類卡片以 /cases#wedding 指定要開啟的分頁
  useEffect(() => {
    const applyHash = () => {
      const slug = window.location.hash.slice(1);
      if (categories.some((item) => item.slug === slug)) setCurrentSlug(slug);
    };

    applyHash();
    // 這個 hash 不是頁內錨點，瀏覽器不會捲動，ScrollToTop 也因有 hash 而略過
    window.scrollTo(0, 0);

    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [categories]);

  const current =
    categories.find((item) => item.slug === currentSlug) ?? categories[0];

  // 分類全部被隱藏時不該整頁崩潰
  if (!current) return null;

  const items = itemsBySlug[current.slug] ?? [];

  const select = (slug: string) => {
    setCurrentSlug(slug);
    // 更新網址但不留下歷史紀錄，返回鍵仍回到首頁
    window.history.replaceState(null, "", `#${slug}`);
    window.scrollTo(0, 0);
  };

  return (
    // 案例頁的選單僅五項，Tablet 不需兩列，故覆寫頁首高度為 73
    <div className="contents max-lg:[--header-h:73px] max-md:[--header-h:106px]">
      <CasePageHeader
        categories={categories}
        current={current.slug}
        onSelect={select}
      />

      <main className="bg-white pt-(--header-h)">
        {/* 標題與註記，對應設計稿 1:5860 與 1:5863。
            設計稿中此區隨頁首固定，故用 sticky 貼在頁首下緣 */}
        <div className="sticky top-(--header-h) z-40 flex flex-col items-center bg-white px-4">
          <h1 className="py-6 text-center text-h2 font-bold tracking-[6px] text-brand-ink">
            【{current.label}】
            <br />
            {current.tagline}
          </h1>
          <p className="pb-6 text-center text-title text-brand">
            ※
            因部分合作案件涉及保密協議，網站僅展示部分案例，更多合作經驗歡迎與我們聯繫。
          </p>
        </div>

        {/* 兩欄格線：Desktop 1200 寬（600x424）、Laptop 900 寬（450x318） */}
        <ul className="mx-auto grid max-w-[1200px] grid-cols-2 px-0 max-xl:max-w-[900px] max-lg:max-w-[700px] max-lg:grid-cols-1 max-md:max-w-[350px]">
          {items.map((item, index) => (
            <li key={item.id} className="relative aspect-[600/424]">
              <Image
                src={item.src}
                alt={`${current.label}案例 ${item.name}`}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                // 首屏四張優先載入，其餘延遲
                priority={index < 4}
                className="object-cover"
              />
            </li>
          ))}
        </ul>

        {/* 與首頁同一句標語，Mobile 用 H2 才不會折行 */}
        <p className="py-6 text-center text-h1 text-brand max-md:text-h2">
          “讓每一次快門，都留下燦爛瞬間。”
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
