export type NavItem = { label: string; href: string };

/** 頁首主選單 —— 設計稿 Header/Desktop */
export const NAV_ITEMS: NavItem[] = [
  { label: "門市資訊", href: "/#stores" },
  { label: "機台介紹", href: "/#machines" },
  { label: "活動案例", href: "/#cases" },
  { label: "租借流程", href: "/#process" },
  { label: "租借方案", href: "/#plans" },
  { label: "互惠合作", href: "/#partnership" },
  { label: "常見問題", href: "/#faq" },
  { label: "聯絡我們", href: "/#contact" },
];

/** 頁尾三欄導覽 —— 設計稿 Footer Column 1~3 */
export const FOOTER_COLUMNS: { header: string; items: NavItem[] }[] = [
  {
    header: "關於我們",
    items: [
      { label: "門市資訊", href: "/#stores" },
      { label: "機台介紹", href: "/#machines" },
      { label: "活動案例", href: "/#cases" },
    ],
  },
  {
    header: "租借服務",
    items: [
      { label: "租借流程", href: "/#process" },
      { label: "租借方案", href: "/#plans" },
      { label: "互惠合作", href: "/#partnership" },
    ],
  },
  {
    header: "服務資訊",
    items: [
      { label: "常見問題", href: "/#faq" },
      { label: "聯絡我們", href: "/#contact" },
    ],
  },
];
