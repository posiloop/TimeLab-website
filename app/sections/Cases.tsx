import Image from "next/image";
import Link from "next/link";
import SectionTitle from "../components/SectionTitle";
import { getCaseCategories } from "../server/content/cases";

export default async function Cases() {
  const categories = await getCaseCategories();

  return (
    <section id="cases" className="px-16 max-lg:px-8 max-md:px-4">
      <SectionTitle>活動案例</SectionTitle>

      <p className="pb-6 text-center text-title text-brand">
        ※ 因部分合作案件涉及保密協議，網站僅展示部分案例，更多合作經驗歡迎與我們聯繫。
      </p>

      {/* 設計稿為三欄格線，末列兩張靠左對齊 */}
      <ul className="mx-auto grid max-w-[1060px] grid-cols-3 gap-5 px-4 pb-6 max-md:grid-cols-2">
        {categories.map((item) => (
          <li key={item.id}>
            <Link
              href={`/cases#${item.slug}`}
              aria-label={`查看${item.label}案例`}
              className="group flex h-[280px] flex-col max-xl:h-[240px] max-md:h-[203px] items-center justify-center gap-[15px] rounded-[20px] border-2 border-brand-mist bg-white p-[15px] transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[0.96]"
            >
              <span className="w-full text-center text-h2 text-brand-ink">
                {item.label}
              </span>
              {/* hover 時圖片疊上半透明黑遮罩，浮現提示文字 */}
              <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[5px]">
                <Image
                  src={item.cover}
                  alt=""
                  width={303}
                  height={207}
                  className="h-full w-full rounded-[5px] object-cover"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-[5px] bg-black/30 opacity-0 transition-opacity duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
                />
                <span className="absolute inset-0 flex items-center justify-center text-title text-white opacity-0 [text-shadow:0_4px_4px_rgba(0,0,0,0.25)] transition-opacity duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100">
                  點擊查看更多案例
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
