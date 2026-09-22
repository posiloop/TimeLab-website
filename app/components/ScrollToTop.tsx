"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 換頁時捲回頁面頂端。
 * App Router 在新頁面渲染完成前會沿用前一頁的捲動位置，
 * 各頁高度不同，會停在畫面中段或底部。
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const isPopRef = useRef(false);

  // 上一頁／下一頁的捲動位置交給瀏覽器還原，不在此覆寫
  useEffect(() => {
    const markPop = () => {
      isPopRef.current = true;
    };
    window.addEventListener("popstate", markPop);
    return () => window.removeEventListener("popstate", markPop);
  }, []);

  useEffect(() => {
    if (isPopRef.current) {
      isPopRef.current = false;
      return;
    }

    // 指向頁內區塊的錨點（如 /#cases）由瀏覽器捲到該區塊。
    // 換頁當下目標元素尚未掛載，故只看有沒有 hash，不查 DOM。
    if (window.location.hash) return;

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
