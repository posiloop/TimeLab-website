/**
 * 遷移前的內容凍結快照。
 *
 * 這份資料是從 app/data/*.ts 與 app/page.tsx 在遷移當下抄出來的，刻意
 * 與那些檔案解耦：遷移完成後那些常數會被清空，腳本若直接 import 它們
 * 就會跟著失效，也就再也無法重跑驗證。
 *
 * 這同時是「上線後外觀不變」的可 diff 基準 —— Stage 6 會把資料庫讀回來
 * 與這份快照逐欄位比對。
 *
 * ⚠️ 除非確認網站外觀要跟著改變，否則不要修改此檔。
 */

// ---------------------------------------------------------------------------
// 1. 首頁主視覺三軌
// ---------------------------------------------------------------------------
// 值為 roll-NN 的編號（非索引）。三軌共用同一組 12 張相框，各自以不同
// 順序排列，讓三排不會同步捲動。

export const HERO_ORDERS = {
  TRACK_1: [7, 8, 9, 10, 11, 12, 1, 5, 2, 6, 3, 4],
  TRACK_2: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  TRACK_3: [7, 8, 3, 9, 1, 10, 6, 2, 4, 11, 5, 12],
} as const;

/** 版面顯示尺寸。12 張原檔實際有 1920x2860、1048x1561、1048x1563 三種，
    一律以此尺寸呈現才能維持相框等寬與跑馬燈的無縫銜接 */
export const HERO_DISPLAY = { width: 275, height: 410 } as const;

// ---------------------------------------------------------------------------
// 2. 底部活動現場照三軌
// ---------------------------------------------------------------------------
// 高一律 760，寬逐張不同。已驗證這些值等於檔案的真實像素寬。

export const EVENT_WIDTHS: Record<string, Record<string, number>> = {
  e1: { "01": 1013, "02": 570, "03": 1013, "04": 570, "05": 1013, "06": 570, "07": 1013 },
  e2: { "01": 1013, "02": 570, "03": 1140, "04": 570, "05": 1013, "06": 570, "07": 1013 },
  e3: { "01": 570, "02": 1013, "03": 570, "04": 1013, "05": 570, "06": 1013, "07": 1013 },
};

export const EVENT_HEIGHT = 760;

/** 檔名前綴對應的軌別 */
export const EVENT_TRACK_BY_PREFIX = {
  e1: "TRACK_1",
  e2: "TRACK_2",
  e3: "TRACK_3",
} as const;

// ---------------------------------------------------------------------------
// 3. 拍貼框動畫
// ---------------------------------------------------------------------------
// 五個版面參數取自設計稿，無法從檔案推導：poster 原檔五個都是 610x910，
// 但版面寬有 305 與 309 兩種，rotate 與 box* 也各不相同。

export type FrameSource = {
  slug: string;
  alt: string;
  width: number;
  height: number;
  rotate: number;
  boxWidth: number;
  boxHeight: number;
};

export const FRAMES: FrameSource[] = [
  { slug: "4grid", alt: "標準四格拍貼框", width: 305, height: 410, rotate: -2, boxWidth: 320, boxHeight: 421 },
  { slug: "american", alt: "美式俯拍拍貼框", width: 305, height: 410, rotate: 1, boxWidth: 313, boxHeight: 416 },
  { slug: "6grid", alt: "標準六格拍貼框", width: 309, height: 410, rotate: -5, boxWidth: 344, boxHeight: 436 },
  { slug: "pink", alt: "粉色俯拍拍貼框", width: 305, height: 410, rotate: 0, boxWidth: 305, boxHeight: 410 },
  { slug: "8grid", alt: "標準八格拍貼框", width: 305, height: 410, rotate: 3, boxWidth: 326, boxHeight: 426 },
];

// ---------------------------------------------------------------------------
// 4. 活動案例
// ---------------------------------------------------------------------------

export type CategorySource = {
  slug: string;
  label: string;
  tagline: string;
};

export const CASE_CATEGORIES: CategorySource[] = [
  { slug: "brand", label: "品牌", tagline: "品牌快閃店與宣傳活動體驗" },
  { slug: "wedding", label: "婚宴", tagline: "婚禮現場熱門互動與賓客紀念" },
  { slug: "school", label: "學校", tagline: "畢業典禮與社團校園活動熱鬧紀錄" },
  { slug: "corporate", label: "企業", tagline: "尾牙春酒與家庭日熱鬧氣氛打造" },
  { slug: "fandom", label: "應援", tagline: "偶像生日應援與粉絲見面會專屬體驗" },
];

export type CaseItemSource = {
  /** 檔名（不含副檔名），對應 public/images/cases/<file>.jpg */
  file: string;
  name: string;
  /** Figma 圖層 ID，供日後重新匯出原圖時定位 */
  nodeId: string;
};

export const CASE_ITEMS: Record<string, CaseItemSource[]> = {
  brand: [
    { nodeId: "390:231", file: "brand-01", name: "標準 - 籃球隊" },
    { nodeId: "390:241", file: "brand-02", name: "互動 - 飛軒里" },
    { nodeId: "390:259", file: "brand-03", name: "標準 - DEMIN" },
    { nodeId: "390:248", file: "brand-04", name: "互動 - 萬楓酒店" },
    { nodeId: "390:273", file: "brand-05", name: "標準 - 熊本熊" },
    { nodeId: "390:235", file: "brand-06", name: "互動 - UL成人運動會" },
    { nodeId: "390:260", file: "brand-07", name: "標準 - ON LINE平台直播" },
    { nodeId: "390:249", file: "brand-08", name: "互動 - 跨界" },
    { nodeId: "390:267", file: "brand-09", name: "標準 - 時代寓所" },
    { nodeId: "390:237", file: "brand-10", name: "互動 - 台中國際動畫影展" },
    { nodeId: "390:274", file: "brand-11", name: "標準 - 福音教會" },
    { nodeId: "390:244", file: "brand-12", name: "互動 - 基因釀造" },
    { nodeId: "390:257", file: "brand-13", name: "標準 - APLUS" },
    { nodeId: "390:252", file: "brand-14", name: "俯拍 - 不二糕餅" },
    { nodeId: "390:264", file: "brand-15", name: "標準 - 台北新光A9" },
    { nodeId: "390:255", file: "brand-16", name: "俯拍 - 熱磁學院" },
    { nodeId: "390:278", file: "brand-17", name: "標準 - 職人蜂賞" },
    { nodeId: "390:265", file: "brand-18", name: "標準 - 成人展" },
  ],
  wedding: [
    { nodeId: "390:119", file: "wedding-01", name: "標準 - 麗京棧酒店" },
    { nodeId: "390:120", file: "wedding-02", name: "互動 - 士林萬麗酒店" },
    { nodeId: "390:139", file: "wedding-03", name: "標準 - 漢來大飯店" },
    { nodeId: "390:125", file: "wedding-04", name: "互動 - 桃園來福星" },
    { nodeId: "390:134", file: "wedding-05", name: "標準 - 台中林皇宮" },
    { nodeId: "390:121", file: "wedding-06", name: "互動 - 卡果牧場" },
    { nodeId: "390:135", file: "wedding-07", name: "標準 - 台北彭園婚宴館" },
    { nodeId: "390:126", file: "wedding-08", name: "互動 - 桃園流水席" },
    { nodeId: "390:132", file: "wedding-09", name: "標準 - 台中雅園新潮婚宴會館" },
    { nodeId: "390:127", file: "wedding-10", name: "互動 - 無意製所" },
    { nodeId: "390:130", file: "wedding-11", name: "標準 - 大直典華" },
    { nodeId: "390:136", file: "wedding-12", name: "標準 - 台北園外園" },
    { nodeId: "390:131", file: "wedding-13", name: "標準 - 天使仙境" },
    { nodeId: "390:124", file: "wedding-14", name: "互動 - 香格里拉" },
    { nodeId: "390:133", file: "wedding-15", name: "標準 - 台中沙鹿" },
    { nodeId: "390:129", file: "wedding-16", name: "互動 - 豪鼎飯店" },
    { nodeId: "390:138", file: "wedding-17", name: "標準 - 漢來大飯店 02" },
    { nodeId: "390:128", file: "wedding-18", name: "互動 - 圓觀" },
    { nodeId: "390:137", file: "wedding-19", name: "標準 - 房馨" },
    { nodeId: "390:123", file: "wedding-20", name: "互動 - 南港雅悅" },
  ],
  school: [
    { nodeId: "390:143", file: "school-01", name: "標準 - 中央大學設計展" },
    { nodeId: "390:160", file: "school-02", name: "標準 - 興大附中" },
    { nodeId: "390:145", file: "school-03", name: "標準 - 中教大" },
    { nodeId: "390:147", file: "school-04", name: "標準 - 文化大學 02" },
    { nodeId: "390:148", file: "school-05", name: "標準 - 台北聯合國學校" },
    { nodeId: "390:146", file: "school-06", name: "標準 - 文化大學 01" },
    { nodeId: "390:144", file: "school-07", name: "標準 - 中科大設計展" },
    { nodeId: "390:156", file: "school-08", name: "標準 - 復興高中" },
    { nodeId: "390:149", file: "school-09", name: "標準 - 台師大" },
    { nodeId: "390:151", file: "school-10", name: "標準 - 東海大學 02" },
    { nodeId: "390:153", file: "school-11", name: "標準 - 美國學校" },
    { nodeId: "390:161", file: "school-12", name: "標準 - 中山醫學大學" },
    { nodeId: "390:152", file: "school-13", name: "標準 - 東海大學 03" },
    { nodeId: "390:242", file: "school-14", name: "互動 - 家委會" },
    { nodeId: "390:158", file: "school-15", name: "標準 - 華盛頓高中" },
    { nodeId: "390:150", file: "school-16", name: "標準 - 東海大學" },
    { nodeId: "390:157", file: "school-17", name: "標準 - 華盛頓中學" },
    { nodeId: "390:154", file: "school-18", name: "標準 - 師範大學" },
    { nodeId: "390:162", file: "school-19", name: "標準 - 美國學校 02" },
    { nodeId: "390:142", file: "school-20", name: "互動 - 新一代設計展．海洋科大" },
    { nodeId: "390:263", file: "school-21", name: "標準 - 台中市政府" },
    { nodeId: "390:236", file: "school-22", name: "互動 - 不來梅" },
  ],
  corporate: [
    { nodeId: "390:163", file: "corporate-01", name: "互動 - 尾牙 TRACCY" },
    { nodeId: "390:164", file: "corporate-02", name: "互動 - 尾牙 泰商" },
    { nodeId: "390:165", file: "corporate-03", name: "標準 - 生日宴會" },
    { nodeId: "390:166", file: "corporate-04", name: "標準 - 尾牙 大直典華" },
    { nodeId: "390:238", file: "corporate-05", name: "互動 - 永豐銀行" },
    { nodeId: "390:233", file: "corporate-06", name: "互動 - Brother" },
    { nodeId: "390:245", file: "corporate-07", name: "互動 - 博非科技" },
    { nodeId: "390:266", file: "corporate-08", name: "標準 - 序光紀元" },
    { nodeId: "390:239", file: "corporate-09", name: "互動 - 名留集團" },
    { nodeId: "390:240", file: "corporate-10", name: "互動 - 走走品牌" },
    { nodeId: "390:246", file: "corporate-11", name: "互動 - 華谷電機" },
    { nodeId: "390:234", file: "corporate-12", name: "互動 - UBS" },
    { nodeId: "390:261", file: "corporate-13", name: "標準 - 太古汽車" },
    { nodeId: "390:247", file: "corporate-14", name: "互動 - 群健科技" },
    { nodeId: "390:275", file: "corporate-15", name: "標準 - 銳馳物流" },
    { nodeId: "390:243", file: "corporate-16", name: "互動 - 唯勝實業" },
    { nodeId: "390:262", file: "corporate-17", name: "標準 - 心誠鎂" },
    { nodeId: "390:250", file: "corporate-18", name: "互動 - 熙特爾" },
    { nodeId: "390:277", file: "corporate-19", name: "標準 - 諾悠翩雅" },
    { nodeId: "390:272", file: "corporate-20", name: "標準 - 農業署水土保持" },
    { nodeId: "390:271", file: "corporate-21", name: "標準 - 國亨開發" },
    { nodeId: "390:251", file: "corporate-22", name: "互動 - 遠雄人壽" },
  ],
  fandom: [
    { nodeId: "390:268", file: "fandom-01", name: "標準 - 泰國偶像" },
    { nodeId: "390:270", file: "fandom-02", name: "標準 - 偶像咖啡廳" },
  ],
};

// ---------------------------------------------------------------------------
// 5. 常見問題
// ---------------------------------------------------------------------------

export type FaqSource = { question: string; answer: string };

export const FAQ_ITEMS: FaqSource[] = [
  {
    question: "拍貼機租借有提供照片電子檔嗎？",
    answer:
      "拍完照片後，螢幕上會顯示 QR Code，直接掃描即可下載電子檔。電子檔除包含高解析度「JPG 圖片」，還附贈趣味「GIF 動圖」，方便賓客直接上傳 IG、Line 等社群軟體分享！",
  },
  {
    question: "拍貼機的操作需要工作人員全程現場協助嗎？",
    answer:
      "我們提供完整的拍貼機專人送達與架設服務。機台架設完成後，工作人員會請您驗收並進行詳細的操作教學，確認無誤後才離開。若您的婚禮、企業活動或尾牙需要人員全程協助引導，亦可另外加購「現場服務人員」服務。",
  },
  {
    question: "拍貼機租借的場地需求是什麼？空間夠不夠？",
    answer:
      "不同拍貼機機型對坪數、高度與電源需求略有不同。建議您可以先提供場地資訊（坪數、天花板高度、電梯尺寸、電源插座位置），我們將為您評估最適合的拍貼機款式，確保現場活動順利架設。",
  },
  {
    question: "外縣市或戶外活動是否提供拍貼機租借服務？",
    answer:
      "我們提供全台拍貼機租借服務！無論是跨縣市活動、戶外市集或快閃店，只要現場具備基本遮蔽設施與穩定供電條件即可評估架設。歡迎直接提供場地資訊，由專人為您確認可行性。",
  },
  {
    question: "活動現場相紙用完了怎麼辦？相紙可以額外加購嗎？",
    answer:
      "我們的拍貼機基本租借方案均免費提供 700 張高品質相紙。若預估婚禮或活動現場的人潮拍攝需求較大，可於事前告知預購，或現場視情況彈性加購相紙數量。",
  },
];
