/** 正式網域 —— canonical、sitemap 與 OG 圖皆需絕對網址。
    部署時以 NEXT_PUBLIC_SITE_URL 覆寫 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://timelabtw.com";

/** 公司登記資料 —— 與頁尾顯示的內容同源 */
export const COMPANY = {
  name: "時光研究室 TiMELAB",
  legalName: "富鼎行銷有限公司",
  taxId: "85054499",
  phone: "+886-4-22541881",
} as const;
