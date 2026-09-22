import type { Metadata } from "next";
import { Inter, Noto_Sans_TC } from "next/font/google";
import ScrollToTop from "./components/ScrollToTop";
import "./globals.css";

// 設計稿的文字樣式指定 Inter；中文字元不在其字集內，交由 Noto Sans TC 承接
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

export const metadata: Metadata = {
  title: "時光研究室 TiMELAB｜全台指標韓式拍貼品牌",
  description:
    "千場實績，定義拍貼新標準。從數十人的聚會到數萬人的大型活動，每一次快門，都留下燦爛瞬間。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant-TW"
      // 告知 Next.js 平滑捲動是刻意設定的，換頁時會暫時停用以免捲不到位
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${notoSansTC.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
