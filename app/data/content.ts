export const RENTAL_STEPS = [
  { no: "01", title: "填寫租借表單", desc: "提供活動資訊，完成租借需求申請。" },
  { no: "02", title: "加入官方 LINE", desc: "由專人與您聯繫，快速確認相關資訊。" },
  { no: "03", title: "規劃租借方案", desc: "依活動需求提供最適合的機台配置與服務內容。" },
  { no: "04", title: "活動前準備", desc: "完成客製化視覺設計、方案確認及活動細節安排。" },
  { no: "05", title: "活動現場服務", desc: "專人進場架設設備、操作教學，確保活動順利進行。" },
  { no: "06", title: "設備撤場與結案", desc: "活動結束後完成設備拆除、場地復原及結案確認。" },
];

export const PLAN_ROWS = [
  { label: "租借時間", items: ["4小時起(可依需求異動)"], ordered: false },
  {
    label: "基本服務",
    items: [
      "提供700張高品質相紙",
      "機台大眾運輸及搬運",
      "人員現場定位及上機測試",
      "實體拍貼後可掃 QRcord 儲存電子檔",
    ],
    ordered: true,
  },
  {
    label: "客製化免費設計",
    items: ["機台首頁 UI", "客製化相框 2 組"],
    ordered: true,
  },
];

export const PLAN_ADDONS = [
  "夜間加成：進或撤場時間超過下午六點",
  "服務人員：現場全程指引，協助機台操作",
  "電子檔打包：協助處理後續所有電子檔打包",
  "品牌視覺設計：依機型搭配布簾、包廂與背板",
];

export type Partnership = {
  id: string;
  title: string;
  tagline: string;
  features: string[];
  highlight: string;
  desc: string;
};

export const PARTNERSHIPS: Partnership[] = [
  {
    id: "venue",
    title: "場域活化×收益合作",
    tagline: "【 讓每一坪空間，多一個賺錢的理由 】",
    features: ["導入零成本", "共享營收", "全程代管"],
    highlight: "場域不變，收入改變",
    desc: "利用既有來客與閒置空間，打造高互動拍貼體驗區，創造額外收入與社群曝光。",
  },
  {
    id: "brand",
    title: "品牌活動×互動曝光",
    tagline: "【 讓每一次拍照，都成為活動曝光的延伸 】",
    features: ["客製化相框", "品牌視覺整合", "活動現場支援", "社群擴散效益"],
    highlight: "活動帶來人潮，拍照延續熱潮",
    desc: "利用拍貼互動體驗，提升參與感、創造分享率、放大活動影響力。",
  },
];
