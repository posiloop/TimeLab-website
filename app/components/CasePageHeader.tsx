import Image from "next/image";
import Link from "next/link";

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
            { label: "Instagram", href: "https://www.instagram.com/", text: "IG" },
            { label: "官方 LINE", href: "https://line.me/", text: "LINE" },
            { label: "租借表單", href: "#", text: "租借\n表單" },
          ].map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                aria-label={link.label}
                className="flex size-[50px] items-center justify-center whitespace-pre-line rounded-[10px] bg-brand text-center text-xs leading-tight text-white transition-opacity hover:opacity-80 max-md:size-10"
              >
                {link.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
