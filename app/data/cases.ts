export type CaseCategory = {
  id: string;
  label: string;
  /** 分頁標題的副標，取自設計稿各分類頁 */
  tagline: string;
  /** 分類縮圖，橫式 606x414（卡片內顯示約 303x207） */
  cover: string;
};

export const CASE_CATEGORIES: CaseCategory[] = [
  {
    id: "brand",
    label: "品牌",
    tagline: "品牌快閃店與宣傳活動體驗",
    cover: "/images/case-covers/brand.jpg",
  },
  {
    id: "wedding",
    label: "婚宴",
    tagline: "婚禮現場熱門互動與賓客紀念",
    cover: "/images/case-covers/wedding.jpg",
  },
  {
    id: "school",
    label: "學校",
    tagline: "畢業典禮與社團校園活動熱鬧紀錄",
    cover: "/images/case-covers/school.jpg",
  },
  {
    id: "corporate",
    label: "企業",
    tagline: "尾牙春酒與家庭日熱鬧氣氛打造",
    cover: "/images/case-covers/corporate.jpg",
  },
  {
    id: "fandom",
    label: "應援",
    tagline: "偶像生日應援與粉絲見面會專屬體驗",
    cover: "/images/case-covers/fandom.jpg",
  },
];
