export type CaseCategory = {
  id: string;
  label: string;
  /** 分類縮圖，直式 287x580 */
  cover: string;
};

export const CASE_CATEGORIES: CaseCategory[] = [
  { id: "brand", label: "品牌", cover: "/images/case-covers/brand.png" },
  { id: "wedding", label: "婚宴", cover: "/images/case-covers/wedding.png" },
  { id: "school", label: "學校", cover: "/images/case-covers/school.png" },
  {
    id: "corporate",
    label: "企業",
    cover: "/images/case-covers/corporate.png",
  },
  { id: "fandom", label: "應援", cover: "/images/case-covers/fandom.png" },
];
