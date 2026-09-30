"use client";

import {
  Camera,
  CircleQuestionMark,
  Film,
  History,
  Images,
  LayoutTemplate,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "./auth-client";
import ChangePassword from "./ChangePassword";
import ConfirmProvider from "./ConfirmDialog";
import ImagePreviewProvider from "./ImagePreview";
import ToastProvider from "./Toast";

// 順序依使用者指定，大致對應內容在網站上由上而下的位置，
// 最後才是與內容無關的帳號管理與操作紀錄
const NAV = [
  { href: "/admin/hero", label: "首頁主視覺", icon: LayoutTemplate },
  { href: "/admin/frames", label: "拍貼框動畫", icon: Film },
  { href: "/admin/cases", label: "活動案例", icon: Images },
  { href: "/admin/faq", label: "常見問題", icon: CircleQuestionMark },
  { href: "/admin/events", label: "活動現場照", icon: Camera },
  { href: "/admin/account", label: "帳號管理", icon: Users },
  { href: "/admin/audit", label: "操作紀錄", icon: History },
];

export default function AdminShell({
  userName,
  userEmail,
  children,
}: {
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // 抽屜只在手機存在。inert 不吃媒體查詢，若只看 menuOpen，桌機（永遠
  // false）的側邊欄會整塊被停用，故另外追蹤視窗寬度
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(width < 48rem)");
    const sync = () => setIsMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const signOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  // startsWith 讓 /admin/cases/brand 也把「活動案例」標為所在頁
  const currentLabel = NAV.find((item) => pathname.startsWith(item.href))?.label;

  // 抽屜打開時鎖住背景捲動，否則手指在抽屜上滑會帶著底下的頁面一起動
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  // Esc 關閉抽屜，與後台其他對話框一致
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const nav = NAV.map((item) => {
    const active = pathname.startsWith(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        // 點了就收 —— 抽屜留在畫面上會蓋住剛進入的那一頁。
        // 寫在這裡而非監聽 pathname 的 effect：點同一頁也該收起來
        onClick={() => setMenuOpen(false)}
        className={`flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm transition-colors duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] max-md:py-3 ${
          active
            ? "bg-brand font-bold text-white"
            : "text-brand-ink hover:bg-white"
        }`}
      >
        <Icon aria-hidden className="size-4 shrink-0" />
        {item.label}
      </Link>
    );
  });

  // 名字與 email 在桌機側邊欄與手機抽屜是同一塊，抽出來免得改了一邊漏另一邊。
  // 多帳號時要看得出現在是誰登入 —— 名字可能重複或含糊，email 才是唯一的
  // 識別。過長時截斷，滑過去看得到完整值
  const identity = (
    <div className="flex min-w-0 flex-col px-3 max-md:px-0">
      <span className="truncate text-caption text-brand-ink">{userName}</span>
      <span
        title={userEmail}
        className="truncate text-[12px] leading-4 text-brand-ink/50"
      >
        {userEmail}
      </span>
    </div>
  );

  const signOutButton = (
    <button
      type="button"
      onClick={signOut}
      disabled={signingOut}
      className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-caption text-brand transition-colors hover:bg-white disabled:opacity-50 max-md:py-2"
    >
      <LogOut aria-hidden className="size-3.5" />
      {signingOut ? "登出中…" : "登出"}
    </button>
  );

  return (
    // ToastProvider 包住整個版面而非只有 main —— 抽屜裡的修改密碼也要能跳提示
    <ToastProvider>
      {/* admin-scope：globals.css 以它把手機的表單欄位撐到 16px，
          避開 iOS Safari 聚焦時的自動放大 */}
      <div className="admin-scope flex min-h-dvh bg-brand-canvas max-md:flex-col">
        {/* 手機：頂端一條 header，選單收進漢堡抽屜。
            6 個中文項目橫向排會折成三行、吃掉螢幕上方一大塊，
            而後台每一頁的內容都比導覽重要 */}
        <header className="sticky top-0 z-40 hidden items-center gap-3 border-b border-brand/15 bg-brand-mist px-4 py-3 max-md:flex">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="開啟選單"
            aria-expanded={menuOpen}
            className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full text-brand transition-colors hover:bg-white"
          >
            <Menu aria-hidden className="size-6" />
          </button>

          {/* 當前頁名而非標誌 —— 抽屜關著時，這是唯一能確認「我在哪一頁」的線索 */}
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-brand-ink">
            {currentLabel ?? "網站內容管理"}
          </span>

          <Image
            src="/images/brand/logo-wide.png"
            alt="時光研究室 TiMELAB"
            width={488}
            height={88}
            priority
            className="h-[22px] w-auto shrink-0 object-contain"
          />
        </header>

        {/* 手機抽屜的半透明背景。點它關閉，與後台各對話框的行為一致。
            aria-hidden：關閉選單已有抽屜裡那顆 X，背景再報一次同樣的名稱，
            螢幕報讀者會唸到兩個「關閉選單」卻分不出差別 */}
        {menuOpen && (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 hidden bg-black/50 max-md:block"
          />
        )}

        {/* sticky + 視窗高度：側邊欄若跟著內容一起長高，mt-auto 的登出區
            會被推到整頁最底部，得捲到最後才看得到。
            手機改為固定定位的抽屜，以 translate 滑入滑出 */}
        <aside
          className={`sticky top-0 flex h-dvh w-60 shrink-0 flex-col gap-1 overflow-y-auto bg-brand-mist p-4 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-[min(17rem,85vw)] max-md:shadow-[4px_0_24px_rgba(0,0,0,0.18)] max-md:transition-transform max-md:duration-[400ms] max-md:ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
          }`}
          // 手機收起時整塊移出焦點順序，否則鍵盤 Tab 會跑進滑出畫面外的選單
          inert={isMobile && !menuOpen}
        >
          <div className="flex items-start justify-between gap-2 px-3 py-4 max-md:px-0">
            <div className="flex flex-col gap-1">
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

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="關閉選單"
              className="-mr-2 hidden size-10 shrink-0 place-items-center rounded-full text-brand transition-colors hover:bg-white max-md:grid"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>

          {nav}

          <div className="mt-auto flex flex-col gap-1 border-t border-brand/20 px-3 pt-4 max-md:px-0">
            {identity}
            <ChangePassword />
            {signOutButton}
          </div>
        </aside>

        {/* 兩者各自只有一個實例供所有管理頁共用：
            放大預覽由縮圖以 useImagePreview() 觸發，提示訊息以 useToast()。
            Toast 固定在視窗角落，故包在 main 外層不受其內距影響 */}
        {/* pb 要讓過底部的未儲存提示列，否則頁面最後一個元件按不到。
            手機那條是直向堆疊的，比桌機高 */}
        <main className="min-w-0 flex-1 p-8 pb-32 max-md:p-4 max-md:pb-40">
          <ConfirmProvider>
            <ImagePreviewProvider>{children}</ImagePreviewProvider>
          </ConfirmProvider>
        </main>
      </div>
    </ToastProvider>
  );
}
