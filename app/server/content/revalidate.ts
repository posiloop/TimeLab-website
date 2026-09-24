import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS, type ContentSection } from "./tags";

/**
 * 每個區塊改動後要失效哪些路徑。
 *
 * tag 讓 unstable_cache 的 entry 失效，revalidatePath 讓已產生的 RSC
 * payload 失效 —— 兩者缺一不可：只失效 tag，頁面層的靜態 payload 仍是舊的；
 * 只失效 path，下次 render 又會讀到同一份沒過期的 cache entry。
 */
const AFFECTED: Record<ContentSection, string[]> = {
  hero: ["/"],
  events: ["/"],
  frames: ["/"],
  // FAQ 同時餵畫面的 Accordion 與 StructuredData 的 FAQPage JSON-LD，
  // 只更新其一會讓搜尋結果顯示與網頁不符的答案
  faq: ["/"],
  // 分類同時出現在首頁卡片與案例頁
  cases: ["/", "/cases"],
};

/**
 * 內容異動後的唯一失效入口。所有後台寫入操作的最後一步都呼叫這裡，
 * 不要在別處直接呼叫 revalidateTag。
 *
 * 關鍵：第二個參數必須是 { expire: 0 }。Next 16 文件把 "max" 標為
 * recommended，但那只會把快取標記為 stale —— 下一位訪客仍先拿到舊內容，
 * 第二次重整才正確。這種「間歇性正確」的問題極難被回報清楚，
 * 也不符合使用者要的「改完立即生效」。
 */
export function revalidateContent(section: ContentSection): void {
  revalidateTag(TAGS[section], { expire: 0 });
  for (const path of AFFECTED[section]) revalidatePath(path);
}
