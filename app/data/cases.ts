export type CaseCategory = {
  id: string;
  label: string;
  /** 分類縮圖 —— 尚待 Figma 額度恢復後補上原檔 */
  cover?: string;
};

export const CASE_CATEGORIES: CaseCategory[] = [
  { id: "brand", label: "品牌" },
  { id: "wedding", label: "婚宴" },
  { id: "school", label: "學校" },
  { id: "corporate", label: "企業" },
  { id: "fandom", label: "應援" },
];
