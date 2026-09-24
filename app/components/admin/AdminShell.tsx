"use client";

import {
  Camera,
  CircleQuestionMark,
  Film,
  Images,
  LayoutTemplate,
  LogOut,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "./auth-client";
import ChangePassword from "./ChangePassword";
import ConfirmProvider from "./ConfirmDialog";
import ImagePreviewProvider from "./ImagePreview";
import ToastProvider from "./Toast";

// 順序依使用者指定，大致對應內容在網站上由上而下的位置，
// 最後才是與內容無關的帳號管理
const NAV = [
  { href: "/admin/hero", label: "首頁主視覺", icon: LayoutTemplate },
  { href: "/admin/frames", label: "拍貼框動畫", icon: Film },
  { href: "/admin/cases", label: "活動案例", icon: Images },
  { href: "/admin/faq", label: "常見問題", icon: CircleQuestionMark },
  { href: "/admin/events", label: "活動現場照", icon: Camera },
  { href: "/admin/account", label: "帳號管理", icon: Users },
];

export default function AdminShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    // ToastProvider 包住整個版面而非只有 main —— 側邊欄的修改密碼也要能跳提示
    <ToastProvider>
      <div className="flex min-h-dvh bg-brand-canvas max-md:flex-col">
        {/* sticky + 視窗高度：側邊欄若跟著內容一起長高，mt-auto 的登出區
            會被推到整頁最底部，得捲到最後才看得到。
            Mobile 改回一般流排版，選單橫向排列於頁面上方 */}
        <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col gap-1 overflow-y-auto bg-brand-mist p-4 max-md:static max-md:h-auto max-md:w-full max-md:flex-row max-md:flex-wrap max-md:gap-2 max-md:overflow-visible">
          <div className="flex flex-col gap-1 px-3 py-4 max-md:hidden">
            <Image
              src="/images/brand/logo-wide.png"
              alt="時光研究室 TiMELAB"
              width={488}
              height={88}
              priority
              className="h-[26px] w-auto self-start object-contain"
            />
            <p className="text-caption text-brand-ink">網站內容管理</p>
        </div>

        {NAV.map((item) => {
          // startsWith 讓 /admin/cases/brand 也把「活動案例」標為所在頁
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm transition-colors duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                active
                  ? "bg-brand font-bold text-white"
                  : "text-brand-ink hover:bg-white"
              }`}
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col gap-1 border-t border-brand/20 px-3 pt-4 max-md:mt-0 max-md:w-full max-md:flex-row max-md:items-center max-md:border-t-0 max-md:pt-0">
          <span className="truncate px-3 text-caption text-brand-ink max-md:px-0">
            {userName}
          </span>
          <ChangePassword />
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-caption text-brand transition-colors hover:bg-white disabled:opacity-50"
          >
            <LogOut aria-hidden className="size-3.5" />
            {signingOut ? "登出中…" : "登出"}
          </button>
        </div>
      </aside>

      {/* 兩者各自只有一個實例供所有管理頁共用：
          放大預覽由縮圖以 useImagePreview() 觸發，提示訊息以 useToast()。
          Toast 固定在視窗角落，故包在 main 外層不受其內距影響 */}
      <main className="min-w-0 flex-1 p-8 pb-32 max-md:p-4 max-md:pb-32">
        <ConfirmProvider>
          <ImagePreviewProvider>{children}</ImagePreviewProvider>
        </ConfirmProvider>
        </main>
      </div>
    </ToastProvider>
  );
}
