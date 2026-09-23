import type { Metadata } from "next";
import {
  getCaseCategories,
  getCaseItemsBySlug,
} from "../server/content/cases";
import CasesView from "./CasesView";

export const metadata: Metadata = {
  title: "活動案例｜時光研究室 TiMELAB",
  description:
    "品牌快閃、婚宴、校園、企業與應援活動的拍貼機實績，從數百人到數萬人規模皆有執行經驗。",
  alternates: { canonical: "/cases" },
  openGraph: {
    title: "活動案例｜時光研究室 TiMELAB",
    description:
      "品牌快閃、婚宴、校園、企業與應援活動的拍貼機實績，從數百人到數萬人規模皆有執行經驗。",
    url: "/cases",
  },
};

export default async function CasesPage() {
  // 在此取資料再以 props 傳入：CasesView 是 client component，
  // 不能直接 import 伺服器模組
  const [categories, itemsBySlug] = await Promise.all([
    getCaseCategories(),
    getCaseItemsBySlug(),
  ]);

  return <CasesView categories={categories} itemsBySlug={itemsBySlug} />;
}
