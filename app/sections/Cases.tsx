import Image from "next/image";
import Link from "next/link";
import SectionTitle from "../components/SectionTitle";
import { CASE_ITEMS, READY_CATEGORIES } from "../data/case-items";
import { CASE_CATEGORIES } from "../data/cases";

export default function Cases() {
  return (
    <section
      id="cases"
      className="flex flex-col items-center gap-[30px] px-4 pt-[150px] max-md:pt-20"
    >
      <SectionTitle>活動案例</SectionTitle>

      <p className="text-center text-h2 text-brand [paint-order:stroke] [-webkit-text-stroke:3px_#FFFFFF] max-md:text-base">
        ※ 因部分合作案件涉及保密協議，網站僅展示部分案例，更多合作經驗歡迎與我們聯繫。
      </p>

      <ul className="flex w-full max-w-[1328px] justify-between gap-4 max-lg:flex-wrap max-lg:justify-center">
        {CASE_CATEGORIES.map((item) => (
          <li key={item.id}>
            <Link
              href={`/cases/${item.id}`}
              className="flex h-[60px] w-[100px] items-center justify-center rounded-[25px] text-h1 text-brand-ink transition-colors hover:text-brand max-md:h-11 max-md:w-20 max-md:text-xl"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <ul className="flex w-full max-w-[1515px] justify-between gap-5 max-lg:flex-wrap max-lg:justify-center">
        {CASE_CATEGORIES.map((item) => {
          // 以該分類的第一張案例圖作為封面，圖片未備妥則顯示文字
          const cover = READY_CATEGORIES.has(item.id)
            ? CASE_ITEMS[item.id]?.[0]
            : undefined;

          return (
            <li key={item.id}>
              <Link
                href={`/cases/${item.id}`}
                aria-label={`查看${item.label}案例`}
                className="block h-[580px] w-[287px] overflow-hidden rounded-[20px] bg-brand-mist transition-transform hover:scale-[1.02] max-lg:h-[400px] max-lg:w-[200px]"
              >
                {cover ? (
                  <Image
                    src={`/images/cases/${cover.file}.png`}
                    alt=""
                    width={287}
                    height={580}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-h1 text-brand">
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
