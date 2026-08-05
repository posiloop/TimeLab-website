import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CasePageHeader from "../../components/CasePageHeader";
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
    <>
      <CasePageHeader />

      <main className="bg-white pt-[100px]">
        <div className="sticky top-[100px] z-40 flex flex-col items-center gap-[30px] bg-white pt-[42px] pb-10">
          <nav aria-label="案例分類" className="px-4">
            <ul className="flex flex-wrap justify-center gap-[25px] max-md:gap-2">
              <li>
                <Link
                  href="/#cases"
                  className="flex h-10 w-[120px] items-center justify-center rounded-full text-h2 text-brand-ink transition-colors hover:bg-brand-mist max-md:w-auto max-md:px-4 max-md:text-base"
                >
                  返回
                </Link>
              </li>
              {CASE_CATEGORIES.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/cases/${item.id}`}
                    aria-current={item.id === category ? "page" : undefined}
                    className={`flex h-10 w-[120px] items-center justify-center rounded-full text-h2 transition-colors max-md:w-auto max-md:px-4 max-md:text-base ${
                      item.id === category
                        ? "bg-brand-mist text-brand-ink"
                        : "text-brand-ink hover:bg-brand-mist"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <h1 className="flex flex-col items-center gap-[5px]">
            <span className="pl-[0.5em] text-center text-section tracking-[0.5em] text-brand max-md:text-[28px]">
              活動案例
            </span>
            <span className="h-[3px] w-[220px] bg-brand max-md:w-[160px]" />
          </h1>

          <p className="px-4 text-center text-h2 text-brand max-md:text-base">
            ※ 因部分合作案件涉及保密協議，網站僅展示部分案例，更多合作經驗歡迎與我們聯繫。
          </p>
        </div>

        <ul className="grid grid-cols-2 max-md:grid-cols-1">
          {items.map((item, index) => (
            <li key={item.file} className="relative aspect-[960/679]">
              <Image
                src={`/images/cases/${item.file}.png`}
                alt={`${current.label}案例 ${item.name}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                // 首屏四張優先載入，其餘延遲
                priority={index < 4}
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
