import { z } from "zod";
import type { ContentSection } from "@/app/server/content/tags";

/**
 * 內容 API 的資源定義。
 *
 * 五種資源各自對應一個 Prisma model、一個失效區塊，以及建立與更新時
 * 各自允許的欄位。集中在這裡而非散在 handler 裡，是為了讓「外部能寫
 * 什麼」有單一一份可稽核的清單 —— 這份清單就是這個端點的攻擊面。
 */

const trackSchema = z.enum(["TRACK_1", "TRACK_2", "TRACK_3"]);

/**
 * 各資源建立時的必填欄位。
 *
 * 刻意與後台 server action 的規則一致（見 app/(admin)/admin/actions.ts）：
 * 同一份內容不該因為從哪個入口寫入而有不同的驗證標準。
 */
const CREATE = {
  hero: z.object({
    assetId: z.string().min(1),
    track: trackSchema,
    displayWidth: z.number().int().positive().default(275),
    displayHeight: z.number().int().positive().default(410),
    alt: z.string().trim().optional(),
    isVisible: z.boolean().default(true),
  }),
  events: z.object({
    assetId: z.string().min(1),
    track: trackSchema,
    displayWidth: z.number().int().positive(),
    displayHeight: z.number().int().positive().default(760),
    alt: z.string().trim().optional(),
    isVisible: z.boolean().default(true),
  }),
  faq: z.object({
    question: z.string().trim().min(1, "請填寫問題"),
    answer: z.string().trim().min(1, "請填寫答案"),
    isVisible: z.boolean().default(true),
  }),
  cases: z.object({
    categoryId: z.string().min(1),
    assetId: z.string().min(1),
    name: z.string().trim().min(1, "請填寫案例名稱"),
    isVisible: z.boolean().default(true),
  }),
  // width/height 是「轉檔後的影片尺寸」而非版面尺寸，與後台的
  // createFrameAnimation 一致 —— 版面高固定 410、寬照比例算，
  // slug 與 box* 也都由伺服器推導，外部給不出也不該給
  frames: z.object({
    alt: z.string().trim().min(1, "請填寫描述文字"),
    posterId: z.string().min(1),
    webmId: z.string().min(1),
    mp4Id: z.string().min(1),
    gifId: z.string().min(1).optional(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    isVisible: z.boolean().default(true),
  }),
} as const;

/**
 * 各資源可更新的欄位，全部選填 —— PATCH 只改送來的那幾個。
 *
 * 少數欄位刻意不開放：
 * - 分類的 slug：對外連結依賴它，改了舊連結會靜默導向錯誤分類
 * - 任何資源的 position：排序另有專屬端點，散著改會撞唯一約束
 * - asset 關聯：換圖等同換內容，走建立新項目比較不會出意外
 */
const UPDATE = {
  hero: z.object({
    alt: z.string().trim().optional(),
    displayWidth: z.number().int().positive().optional(),
    displayHeight: z.number().int().positive().optional(),
    isVisible: z.boolean().optional(),
  }),
  events: z.object({
    alt: z.string().trim().optional(),
    displayWidth: z.number().int().positive().optional(),
    displayHeight: z.number().int().positive().optional(),
    isVisible: z.boolean().optional(),
  }),
  faq: z.object({
    question: z.string().trim().min(1).optional(),
    answer: z.string().trim().min(1).optional(),
    isVisible: z.boolean().optional(),
  }),
  cases: z.object({
    name: z.string().trim().min(1).optional(),
    isVisible: z.boolean().optional(),
  }),
  // rotate 一改，boxWidth/boxHeight 必須同步重算，否則影片四角會被
  // 容器裁掉。handler 會自己算，這裡不開放外部直接指定 box*
  frames: z.object({
    alt: z.string().trim().min(1).optional(),
    rotate: z.number().min(-45).max(45).optional(),
    displayWidth: z.number().int().positive().optional(),
    displayHeight: z.number().int().positive().optional(),
    isVisible: z.boolean().optional(),
  }),
} as const;

export type Resource = keyof typeof CREATE;

/** Prisma client 上的屬性名，與失效區塊一併查表 */
const MODEL: Record<Resource, string> = {
  hero: "heroSlide",
  events: "eventPhoto",
  faq: "faqItem",
  cases: "caseItem",
  frames: "frameAnimation",
};

/**
 * 有些資源的 position 唯一性是「每軌各自連號」而非全表連號，
 * 新增時要挑對範圍的最後一筆，否則會撞 @@unique([track, position])
 */
const SCOPED_BY: Partial<Record<Resource, "track" | "categoryId">> = {
  hero: "track",
  events: "track",
  cases: "categoryId",
};

export function isResource(value: string): value is Resource {
  return value in CREATE;
}

export const resourceList = Object.keys(CREATE) as Resource[];

export function definitionOf(resource: Resource) {
  return {
    create: CREATE[resource],
    update: UPDATE[resource],
    model: MODEL[resource],
    // 區塊名與資源名目前一致，但兩者概念不同（一個是快取標籤、
    // 一個是 API 路徑），分開查表免得日後其中一邊改名時靜默錯位
    section: resource as ContentSection,
    scopedBy: SCOPED_BY[resource],
  };
}
