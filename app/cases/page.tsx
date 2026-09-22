import type { Metadata } from "next";
import CasesView from "./CasesView";

export const metadata: Metadata = {
  title: "活動案例｜時光研究室 TiMELAB",
  description:
    "品牌快閃、婚宴、校園、企業與應援活動的拍貼機實績，從數百人到數萬人規模皆有執行經驗。",
};

export default function CasesPage() {
  return <CasesView />;
}
