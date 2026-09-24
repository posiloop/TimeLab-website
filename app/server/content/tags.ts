/**
 * 快取標籤。單一來源，避免失效端與讀取端各寫各的字串而對不上。
 *
 * 命名為 content:<區塊>，刻意不細分到軌別：三軌永遠一起改、一起顯示，
 * 拆更細不會少 render 任何東西，只會多出「改了軌 2 卻忘記失效軌 2」的出錯面。
 */
export const TAGS = {
  hero: "content:hero",
  events: "content:events",
  frames: "content:frames",
  cases: "content:cases",
  faq: "content:faq",
} as const;

export type ContentSection = keyof typeof TAGS;
