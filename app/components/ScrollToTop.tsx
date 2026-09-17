"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * 切換分類時捲回頁面頂端。
 * App Router 在新頁面渲染完成前會沿用前一頁的捲動位置，
 * 各分類頁高度不同，會停在畫面中段或底部。
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
