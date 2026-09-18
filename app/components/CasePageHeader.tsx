import Image from "next/image";
import Link from "next/link";
import { CASE_CATEGORIES } from "../data/cases";

/** 案例分頁的頁首：LOGO + 五個分類連結（設計稿 Header 1 / 1:5851） */
export default function CasePageHeader({ current }: { current: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-(--header-h) bg-brand-mist">
      <div className="flex h-full items-center justify-between px-16 max-xl:px-8 max-md:flex-col max-md:justify-center max-md:gap-4 max-md:px-4">
        {/* 從分類頁回到首頁時停在活動案例區塊，而非頁面頂端 */}
        <Link href="/#cases" aria-label="回到首頁的活動案例">
          <Image
            src="/images/brand/logo-wide.png"
            alt="時光研究室 TiMELAB"
            width={128}
            height={25}
            priority
            className="h-[25px] w-[128px] object-contain"
          />
        </Link>

        <nav aria-label="案例分類">
          <ul className="flex items-center gap-6 max-md:gap-4">
            {CASE_CATEGORIES.map((item) => (
              <li key={item.id}>
                {/* 設計稿五個分類皆為 Default 狀態，僅 hover 時加底線並提高不透明度 */}
                <Link
                  href={`/cases/${item.id}`}
                  aria-current={item.id === current ? "page" : undefined}
                  className="group/nav block border-b-2 border-transparent text-body text-brand-ink transition-colors hover:border-brand-ink"
                >
                  <span className="opacity-70 transition-opacity group-hover/nav:opacity-100">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
