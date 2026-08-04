import Image from "next/image";
import Link from "next/link";
import { InstagramIcon, LineIcon } from "./SocialIcons";

/** 分頁專屬頁首：橫式 LOGO + 右側三個連結按鈕 */
export default function CasePageHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[100px] bg-brand-mist shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between px-12 max-md:px-5">
        <Link href="/" aria-label="回到首頁">
          {/* 設計稿為橫式 LOGO，待素材補齊後替換 */}
          <Image
            src="/images/brand/logo.png"
            alt="時光研究室 TiMELAB"
            width={80}
            height={60}
            priority
            style={{ height: "auto" }}
            className="w-20 object-contain max-md:w-14"
          />
        </Link>

        <ul className="flex items-center gap-[15px]">
          {[
            { label: "Instagram", href: "https://www.instagram.com/" },
            { label: "官方 LINE", href: "https://line.me/" },
            { label: "租借表單", href: "#" },
          ].map((link) => {
            const external = link.href.startsWith("http");

            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  aria-label={link.label}
                  className={`flex size-[50px] items-center justify-center rounded-[10px] transition-opacity hover:opacity-80 max-md:size-10 ${
                    link.label === "Instagram" ? "text-brand" : "bg-brand"
                  }`}
                >
                  {link.label === "Instagram" && (
                    <InstagramIcon className="size-9 max-md:size-7" />
                  )}
                  {link.label === "官方 LINE" && (
                    <LineIcon className="size-9 text-white max-md:size-7" />
                  )}
                  {link.label === "租借表單" && (
                    <span className="text-center text-xs leading-tight text-white">
                      租借
                      <br />
                      表單
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
}
