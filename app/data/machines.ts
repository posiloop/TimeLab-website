export const MACHINE_TAGS = ["品牌", "婚宴", "學校", "公司", "應援"] as const;

export type Machine = {
  id: string;
  name: string;
  /** 適用場合，對應 MACHINE_TAGS */
  tags: string[];
  /** 尺寸規格，每行一項 */
  specs: string[];
  /** 場地注意事項 */
  note: string;
  camera: string;
  printer: string;
  payment: string;
  /** 機台去背圖 */
  image: string;
};

export const MACHINES: Machine[] = [
  {
    id: "standard",
    name: "標準款機台",
    tags: ["品牌", "婚宴", "學校", "公司", "應援"],
    specs: ["尺寸：長 100＊寬 52＊高 208 (公分)", "重量：110 公斤"],
    note: "※ 需確認「場地高度」及「電梯高度」的距離需高於 210 公分",
    camera: "Canon 佳能 數位單眼相機",
    printer: "DNP 日本高級數位式 熱昇華相片印表機",
    payment: "可設定三種方式：現金、LINE PAY、折價券",
    image: "/images/machines/standard.png",
  },
  {
    id: "interactive",
    name: "互動款機台",
    tags: ["婚宴", "公司"],
    specs: [
      "拍貼機尺寸：長 41＊寬 25＊高 45.3 (公分)",
      "相印機尺寸：長 40.2＊寬 39.4＊高 35.2 (公分)",
      "搭配可折疊三角架：高 113 公分",
    ],
    note: "※ 「相機擺放位置至人站立位置」預留距離約為 100~150 公分",
    camera: "Canon 佳能 數位單眼相機",
    printer: "DNP 日本高級數位式 熱昇華相片印表機",
    payment: "可設定兩種方式：現金、折價券",
    image: "/images/machines/interactive.png",
  },
  {
    id: "y2k",
    name: "俯拍 Y2K 款機台",
    tags: ["品牌", "公司"],
    specs: [
      "操作台機型：長 70＊寬 50＊高 120 (公分)",
      "拍照房：長 100＊寬 100＊高 251.5 (公分)",
    ],
    note: "※需確認「場地高度」及「電梯高度」的距離需高於 260 公分",
    camera: "Canon 佳能 數位單眼相機",
    printer: "DNP 日本高級數位式 熱昇華相片印表機",
    payment: "可設定兩種方式：現金、折價券",
    image: "/images/machines/y2k.png",
  },
];
