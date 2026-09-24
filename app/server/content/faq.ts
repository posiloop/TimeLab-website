import { unstable_cache } from "next/cache";
import type { FaqItem } from "@/app/data/faq";
import { prisma } from "../db";
import { TAGS } from "./tags";

/**
 * 常見問題。同時供畫面的 Accordion 與 StructuredData 的 FAQPage JSON-LD，
 * 兩處必須呼叫這同一個函式，否則搜尋結果會顯示與網頁不符的答案。
 */
async function loadFaqItems(): Promise<FaqItem[]> {
  const items = await prisma.faqItem.findMany({
    where: { isVisible: true },
    orderBy: { position: "asc" },
    select: { question: true, answer: true },
  });
  return items;
}

export const getFaqItems = unstable_cache(
  loadFaqItems,
  ["content", "faq", "v1"],
  { tags: [TAGS.faq], revalidate: false },
);
