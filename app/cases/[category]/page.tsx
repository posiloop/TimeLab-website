import { notFound } from "next/navigation";
import Image from "next/image";
import CasePageHeader from "../../components/CasePageHeader";
import SiteFooter from "../../components/SiteFooter";
import { CASE_ITEMS } from "../../data/case-items";
import { CASE_CATEGORIES } from "../../data/cases";

export function generateStaticParams() {
  return CASE_CATEGORIES.map((category) => ({ category: category.id }));
}

export async function generateMetadata(props: PageProps<"/cases/[category]">) {
  const { category } = await props.params;
  const meta = CASE_CATEGORIES.find((item) => item.id === category);

  return {
    title: meta
      ? `${meta.label}案例｜時光研究室 TiMELAB`
      : "活動案例｜時光研究室 TiMELAB",
    description: meta?.tagline,
  };
}

export default async function CaseCategoryPage(
  props: PageProps<"/cases/[category]">,
) {
  const { category } = await props.params;
  const current = CASE_CATEGORIES.find((item) => item.id === category);
  if (!current) notFound();

  const items = CASE_ITEMS[category] ?? [];

  return (
    // 分類頁的選單僅五項，Tablet 不需兩列，故覆寫頁首高度為 73
    <div className="contents max-lg:[--header-h:73px] max-md:[--header-h:106px]">
      <CasePageHeader current={category} />

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
            <li key={item.file} className="relative aspect-[600/424]">
              <Image
                src={`/images/cases/${item.file}.jpg`}
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

        <p className="py-6 text-center text-h1 text-brand max-md:text-2xl">
          “讓每一次快門，都留下燦爛瞬間。”
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
