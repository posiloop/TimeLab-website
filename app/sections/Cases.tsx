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

      <ul className="flex w-full max-w-[1328px] flex-wrap justify-center gap-4 xl:justify-between">
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

      <ul className="flex w-full max-w-[1515px] flex-wrap justify-center gap-5 xl:justify-between">
        {CASE_CATEGORIES.map((item) => (
          <li key={item.id}>
            {/* hover 時照片淡出白色遮罩，浮現提示文字 */}
            <Link
              href={`/cases/${item.id}`}
              aria-label={`查看${item.label}案例`}
              className="group relative block h-[580px] w-[287px] overflow-hidden rounded-[20px] bg-brand-mist max-lg:h-[400px] max-lg:w-[200px] max-md:h-[360px] max-md:w-[260px]"
            >
              <Image
                src={item.cover}
                alt=""
                width={287}
                height={580}
                className="h-full w-full object-cover"
              />
              {/* hover 時疊上同一張圖的模糊版，用漸層遮罩讓上半保持清晰、下半霧化。
                  遮罩寫成 inline style，避免任意值在 Tailwind 產生無效的 CSS */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  // 上半部完全不套用，霧化從中線之後才開始長出來
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 50%, black 88%)",
                  maskImage:
                    "linear-gradient(to bottom, transparent 50%, black 88%)",
                }}
              >
                <Image
                  src={item.cover}
                  alt=""
                  width={287}
                  height={580}
                  className="h-full w-full scale-110 object-cover blur-[6px]"
                />
              </span>
              {/* 參考圖的漸層：左上近白，往右下暈開成品牌淡紫，文字才浮得出來 */}
              <span
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  // 三層疊加，全部壓在下半部：右下品牌紫、左下暖棕，再鋪一層白霧
                  backgroundImage: [
                    "radial-gradient(120% 52% at 100% 100%, rgba(140,140,180,0.95) 0%, rgba(140,140,180,0.5) 45%, rgba(140,140,180,0) 100%)",
                    "radial-gradient(110% 48% at 0% 100%, rgba(190,163,126,0.9) 0%, rgba(190,163,126,0.42) 45%, rgba(190,163,126,0) 100%)",
                    "linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(255,255,255,0.62) 74%, rgba(255,255,255,0.86) 100%)",
                  ].join(", "),
                }}
              />
              {/* 設計稿定位在卡片高度 79% 處，非垂直置中 */}
              <span className="pointer-events-none absolute inset-x-0 top-[79.5%] -translate-y-1/2 text-center text-h2 text-brand-ink opacity-0 [text-shadow:0_0_10px_white] transition-opacity duration-300 group-hover:opacity-100 max-md:text-base">
                點擊查看更多案例
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
