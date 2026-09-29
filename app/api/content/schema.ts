import { z } from "zod";
import type { Reorderable } from "@/app/server/content/reorder";
import type { ContentSection } from "@/app/server/content/tags";

/**
 * 內容 API 的資源定義。
 *
 * 每種資源各自對應一個 Prisma model、一個失效區塊，以及建立與更新時
 * 各自允許的欄位。集中在這裡而非散在 handler 裡，是為了讓「外部能寫
 * 什麼」有單一一份可稽核的清單 —— 這份清單就是這個端點的攻擊面。
 */

const trackSchema = z.enum(["TRACK_1", "TRACK_2", "TRACK_3"]);

/**
 * 各資源建立時的必填欄位。
 *
 * 刻意與後台 server action 的規則一致（見 app/(admin)/admin/actions.ts）：
 * 同一份內容不該因為從哪個入口寫入而有不同的驗證標準。
 *
 * 不在這裡的資源（categories）不開放新增，POST 會回 405。
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
  // 分類只開放名稱與副標，與後台的 updateCaseCategory 一致。
  // slug、封面與新增刪除都不開放，理由見 NOT_DELETABLE
  categories: z.object({
    label: z.string().trim().min(1, "請填寫分類名稱").optional(),
    tagline: z.string().trim().min(1, "請填寫副標").optional(),
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

export type Resource = keyof typeof UPDATE;

/** Prisma client 上的屬性名 */
const MODEL: Record<Resource, string> = {
  hero: "heroSlide",
  events: "eventPhoto",
  faq: "faqItem",
  cases: "caseItem",
  categories: "caseCategory",
  frames: "frameAnimation",
};

/**
 * 寫入後要失效的快取區塊。
 *
 * 多數資源與區塊同名，但分類與案例照同屬 cases 區塊 —— 前台的案例頁
 * 是一起讀出來的，只失效一邊會讓分類名稱與底下的照片對不上
 */
const SECTION: Record<Resource, ContentSection> = {
  hero: "hero",
  events: "events",
  faq: "faq",
  cases: "cases",
  categories: "cases",
  frames: "frames",
};

/**
 * 不開放刪除的資源。
 *
 * 分類刪掉會連帶刪除底下所有案例照（CaseItem 的 onDelete: Cascade），
 * 一個請求就能清掉幾十張照片；而前台的連結、hash 白名單與 redirect 都
 * 寫死了這五個 slug，少一個分類會讓既有連結靜默導到錯誤的地方。
 * 新增分類同理需要一併改程式碼，故也不在 CREATE 裡
 */
const NOT_DELETABLE: ReadonlySet<Resource> = new Set(["categories"]);

/**
 * 可排序的資源。分類不在其中 —— 後台也沒有開放調整分類順序，
 * 首頁卡片與案例頁的分類順序是版面設計的一部分
 */
const REORDERABLE: Partial<Record<Resource, Reorderable>> = {
  hero: "heroSlide",
  events: "eventPhoto",
  cases: "caseItem",
  faq: "faqItem",
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
  return value in UPDATE;
}

export const resourceList = Object.keys(UPDATE) as Resource[];

export function definitionOf(resource: Resource) {
  return {
    // undefined 代表不開放新增
    create: resource in CREATE ? CREATE[resource as keyof typeof CREATE] : undefined,
    update: UPDATE[resource],
    model: MODEL[resource],
    section: SECTION[resource],
    scopedBy: SCOPED_BY[resource],
    deletable: !NOT_DELETABLE.has(resource),
    // undefined 代表不開放排序
    reorderAs: REORDERABLE[resource],
  };
}
