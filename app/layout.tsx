import type { Metadata } from "next";
import { Noto_Serif_TC } from "next/font/google";
import "./globals.css";

// 設計稿使用 Source Han Serif TC，其 Google Fonts 對應版本為 Noto Serif TC
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
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
      className={`${notoSerifTC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
