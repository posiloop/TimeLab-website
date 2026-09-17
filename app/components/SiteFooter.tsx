import Image from "next/image";
import { FOOTER_COLUMNS } from "../data/nav";

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/timelab_tw_/",
    icon: "/images/social/instagram.png",
  },
  {
    label: "Threads",
    href: "https://www.threads.com/@timelab_tw_",
    icon: "/images/social/threads.png",
  },
  {
    label: "官方 LINE",
    href: "https://line.me/R/ti/p/@034tnwxh",
    icon: "/images/social/line.png",
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-brand-mist px-[120px] pb-[120px] max-xl:px-[62px] max-xl:pb-[62px] max-md:px-4 max-md:pb-10">
      <div className="mx-auto flex max-w-[1200px] items-start justify-between pt-20 max-xl:max-w-[900px] max-xl:pt-16 max-lg:max-w-[700px] max-md:flex-col max-md:gap-10">
        <div className="flex gap-[130px] max-xl:gap-16 max-lg:flex-col max-lg:gap-8">
          <div className="flex flex-col gap-[30px]">
            <Image
              src="/images/brand/logo-wide.png"
              alt="時光研究室 TiMELAB"
              width={180}
              height={35}
              className="h-[35px] w-[180px] object-contain"
            />
            <nav aria-label="社群連結" className="flex items-center gap-6">
              {SOCIALS.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="relative size-6 overflow-hidden transition-opacity hover:opacity-70"
                >
                  {/* 設計稿於黑色圖示上疊深灰並以 lighten 混合染色 */}
                  <Image
                    src={icon}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6 object-contain"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-brand-ink mix-blend-lighten"
                  />
                </a>
              ))}
            </nav>
          </div>

          <div className="flex w-[268px] max-w-full flex-col gap-2">
            <p className="text-h2 text-brand-ink">TiMELAB 時光研究室</p>
            <div className="text-caption text-brand-ink">
              <p>富鼎行銷有限公司 • 統一編號 85054499</p>
              <p className="mt-[22px]">地址：403臺中市西區民龍里公益路143號</p>
              <p>電話：04-22541881</p>
            </div>
          </div>
        </div>

        {/* 設計稿的 Mobile 三欄撐滿整寬（node 1:4670 justify-between） */}
        <div className="flex gap-10 max-md:w-full max-md:justify-between max-md:gap-0">
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.header} className="flex flex-col gap-2">
              <p className="pb-4 text-title text-brand-ink">{column.header}</p>
              {column.items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="group/nav border-b-2 border-transparent text-body text-brand-ink transition-colors hover:border-brand-ink"
                >
                  <span className="opacity-70 transition-opacity group-hover/nav:opacity-100">
                    {item.label}
                  </span>
                </a>
              ))}
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
}
