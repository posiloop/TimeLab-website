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

/** 彈窗中的職責區塊：一個膠囊標籤配一至兩欄條列 */
export type DutyBlock = {
  label: string;
  columns: string[][];
  /** 虛線框（次要）或實線框（主要） */
  dashed?: boolean;
};

export type Feature = {
  label: string;
  icon: string;
};

export type Partnership = {
  id: string;
  title: string;
  tagline: string;
  features: Feature[];
  highlight: string;
  desc: string;
  /** 以下為「更多」彈窗的內容 */
  modal: {
    subtitle: string;
    /** 場域收益卡片，僅場域活化使用 */
    tiers?: { image: string; caption: string; revenue: string }[];
    /** 適用活動類型勾選清單，僅品牌活動使用 */
    eventTypes?: string[];
    /** 活動照拼貼，僅品牌活動使用 */
    gallery?: string[];
    footnote: string;
    duties: DutyBlock[];
  };
};

export const PARTNERSHIPS: Partnership[] = [
  {
    id: "venue",
    title: "場域活化×收益合作",
    tagline: "【 讓每一坪空間，多一個賺錢的理由 】",
    features: [
      { label: "導入零成本", icon: "/images/features/zero-cost.png" },
      { label: "共享營收", icon: "/images/features/revenue-share.png" },
      { label: "全程代管", icon: "/images/features/full-service.png" },
    ],
    highlight: "場域不變，收入改變",
    desc: "利用既有來客與閒置空間，打造高互動拍貼體驗區，創造額外收入與社群曝光。",
    modal: {
      subtitle: "合作場域常見收益區間",
      tiers: [
        {
          image: "/images/partnership/venue-1.png",
          caption: "咖啡廳｜餐廳｜親子空間｜特色店家",
          revenue: "NT$30,000–150,000",
        },
        {
          image: "/images/partnership/venue-2.png",
          caption: "商場櫃位｜景觀餐廳｜文創園區｜連鎖品牌",
          revenue: "NT$150,000–300,000",
        },
        {
          image: "/images/partnership/venue-3.png",
          caption: "熱門景點｜百貨商場",
          revenue: "NT$300,000–500,000+",
        },
      ],
      footnote: "※實際收益依人流、營業時間、客群屬性及合作模式而有所不同。",
      duties: [
        {
          label: "我方負責",
          columns: [
            ["設備提供", "安裝施工", "維修保養", "耗材補充"],
            ["社群曝光", "客服支援", "全程營運管理", "主題設計更新"],
          ],
        },
        {
          label: "場地方提供",
          dashed: true,
          columns: [["電力供應", "小坪數空間", "基本環境清潔", "現場簡易管理"]],
        },
      ],
    },
  },
  {
    id: "brand",
    title: "品牌活動×互動曝光",
    tagline: "【 讓每一次拍照，都成為活動曝光的延伸 】",
    features: [
      { label: "客製化相框", icon: "/images/features/custom-frame.png" },
      { label: "品牌視覺整合", icon: "/images/features/brand-visual.png" },
      { label: "活動現場支援", icon: "/images/features/onsite-support.png" },
      { label: "社群擴散效益", icon: "/images/features/social-reach.png" },
    ],
    highlight: "活動帶來人潮，拍照延續熱潮",
    desc: "利用拍貼互動體驗，提升參與感、創造分享率、放大活動影響力。",
    modal: {
      subtitle: "適用活動類型",
      gallery: [
        "/images/partnership/brand-1.png",
        "/images/partnership/brand-2.png",
        "/images/partnership/brand-3.png",
      ],
      eventTypes: [
        "演唱會",
        "跨年晚會",
        "展覽活動",
        "市集活動",
        "校園活動",
        "政府大型活動",
        "品牌快閃活動",
        "百貨檔期活動",
        "企業活動",
        "開幕活動",
      ],
      footnote: "★  從數百人到數萬人規模活動皆有執行經驗  ★",
      duties: [
        {
          label: "我們所提供的服務",
          columns: [
            ["客製化相框設計", "品牌視覺整合", "現場人員支援", "耗材補充管理"],
            ["活動成果回饋", "多機同步規劃", "設備進駐與撤場"],
          ],
        },
        {
          label: "社群曝光",
          dashed: true,
          columns: [["拍照分享曝光", "主動停留互動", "提升品牌記憶"]],
        },
      ],
    },
  },
];
