import Link from "next/link";
import { prisma } from "@/app/server/db";

const CARDS = [
  {
    href: "/admin/hero",
    title: "首頁主視覺",
    desc: "最上方傾斜的三排相框輪播",
  },
  {
    href: "/admin/events",
    title: "活動現場照",
    desc: "頁面最下方的三排現場照片",
  },
  {
    href: "/admin/frames",
    title: "拍貼框動畫",
    desc: "中段會動的拍貼框影片",
  },
  {
    href: "/admin/cases",
    title: "活動案例",
    desc: "五個分類與各自的案例照片",
  },
  { href: "/admin/faq", title: "常見問題", desc: "問答清單" },
];

export default async function AdminHome() {
  // 各區塊的實際筆數，讓使用者一眼看出內容有沒有被清空
  const [hero, events, frames, cases, faq] = await Promise.all([
    prisma.heroSlide.count({ where: { track: "TRACK_1" } }),
    prisma.eventPhoto.count(),
    prisma.frameAnimation.count(),
    prisma.caseItem.count(),
    prisma.faqItem.count(),
  ]);

  const counts: Record<string, string> = {
    "/admin/hero": `${hero} 張相框`,
    "/admin/events": `${events} 張照片`,
    "/admin/frames": `${frames} 組動畫`,
    "/admin/cases": `${cases} 張案例照`,
    "/admin/faq": `${faq} 則問答`,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 text-brand-ink">網站內容管理</h1>
        <p className="mt-1 text-sm text-brand-ink/70">
          在這裡更新的內容，儲存後網站上會立即生效。
        </p>
      </div>

      <ul className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
        {CARDS.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className="card-surface flex h-full flex-col gap-1 rounded-[16px] p-5 transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[0.98]"
            >
              <span className="text-sm font-bold text-brand">{card.title}</span>
              <span className="text-caption text-brand-ink/70">
                {card.desc}
              </span>
              <span className="mt-auto pt-3 text-caption text-brand-ink">
                目前 {counts[card.href]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
