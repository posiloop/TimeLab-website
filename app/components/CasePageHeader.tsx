import Image from "next/image";
import Link from "next/link";
import { SOCIAL_LINKS } from "../data/links";
import { InstagramIcon, LineIcon } from "./SocialIcons";

/** 分頁專屬頁首：橫式 LOGO + 右側三個連結按鈕 */
export default function CasePageHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-(--header-h) bg-brand-mist shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between px-12 max-md:px-5">
        <Link href="/" aria-label="回到首頁">
          <Image
            src="/images/brand/logo-wide.png"
            alt="時光研究室 TiMELAB"
            width={244}
            height={44}
            priority
            className="h-11 w-auto object-contain max-md:h-8"
          />
        </Link>

        <ul className="flex items-center gap-[15px]">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className={`flex size-[50px] items-center justify-center rounded-[10px] transition-opacity hover:opacity-80 max-md:size-10 ${
                  link.id === "instagram" ? "text-brand" : "bg-brand"
                }`}
              >
                {/* 線稿無底框，視覺重量低於實心色塊，放大並溢出容器以求平衡 */}
                {link.id === "instagram" && (
                  <InstagramIcon className="size-[58px] shrink-0 max-md:size-[46px]" />
                )}
                {link.id === "line" && (
                  <LineIcon className="size-9 text-white max-md:size-7" />
                )}
                {link.id === "form" && (
                  <span className="text-center text-xs leading-tight text-white">
                    租借
                    <br />
                    表單
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
