import Image from "next/image";
import Link from "next/link";
import SectionTitle from "../components/SectionTitle";
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
        {CASE_CATEGORIES.map((item) => (
          <li key={item.id}>
            {/* hover 時照片淡出白色遮罩，浮現提示文字 */}
            <Link
              href={`/cases/${item.id}`}
              aria-label={`查看${item.label}案例`}
              className="group relative block h-[580px] w-[287px] overflow-hidden rounded-[20px] bg-brand-mist max-lg:h-[400px] max-lg:w-[200px]"
            >
              <Image
                src={item.cover}
                alt=""
                width={287}
                height={580}
                className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-25"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-h2 text-brand-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 max-md:text-base">
                點擊查看更多案例
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
