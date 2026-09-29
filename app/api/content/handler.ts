import type { Resource } from "./schema";

/**
 * 五個 model 的 delegate 形狀不同，TypeScript 無法把它們合併成可呼叫的
 * 聯集（與 actions.ts 的 PositionUpdater 同一個問題）。此處收窄成實際
 * 用到的那幾個方法，呼叫端各自確保傳入的欄位對得上 model。
 */
export type AnyDelegate = {
  findMany(args?: unknown): Promise<Record<string, unknown>[]>;
  findFirst(args?: unknown): Promise<Record<string, unknown> | null>;
  findUnique(args: unknown): Promise<Record<string, unknown> | null>;
  create(args: { data: Record<string, unknown> }): Promise<Record<string, unknown>>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
  delete(args: { where: { id: string } }): Promise<Record<string, unknown>>;
};

/** 網站上拍貼框的版面高度，與既有五組及後台的 createFrameAnimation 一致 */
const FRAME_DISPLAY_HEIGHT = 410;

/**
 * 算出旋轉後的外接矩形。
 *
 * 與 FramesEditor 的 boundingBox() 同一道公式：CSS 的 rotate 不改變元素
 * 佔用的版面空間，保留得不夠影片四角就會被容器裁掉。兩處必須一致，
 * 否則同一個角度從後台改與從 API 改會得到不同的保留空間。
 */
export function boundingBox(width: number, height: number, degrees: number) {
  const rad = (Math.abs(degrees) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    boxWidth: Math.ceil(width * cos + height * sin),
    boxHeight: Math.ceil(width * sin + height * cos),
  };
}

/**
 * 把通過驗證的輸入轉成 Prisma 的 create data。
 *
 * 多數資源是原樣帶過，只有拍貼框要推導 slug、版面尺寸與外接矩形 ——
 * 這三者都不該由外部指定：slug 只需唯一、版面與 box* 由影片比例和
 * 角度唯一決定，讓外部填只會多出填錯的機會。
 */
export function buildCreateData(
  resource: Resource,
  input: Record<string, unknown>,
  extra: { position: number },
): Record<string, unknown> {
  if (resource !== "frames") {
    return { ...input, ...extra };
  }

  const { width, height, ...rest } = input as {
    width: number;
    height: number;
    [key: string]: unknown;
  };

  // 版面高固定 410、寬照影片比例縮放，與後台一致。
  // 新增時 rotate 一律 0，故 box* 等於版面尺寸
  const displayWidth = Math.round((width / height) * FRAME_DISPLAY_HEIGHT);

  return {
    ...rest,
    // slug 原本是人工命名（4grid／american）供 S3 舊路徑對照，
    // 新增的沒有對應舊路徑，以時間戳產生即可 —— 只需唯一，不需可讀
    slug: `frame-${Date.now().toString(36)}`,
    displayWidth,
    displayHeight: FRAME_DISPLAY_HEIGHT,
    rotate: 0,
    boxWidth: displayWidth,
    boxHeight: FRAME_DISPLAY_HEIGHT,
    ...extra,
  };
}

/**
 * 把通過驗證的輸入轉成 Prisma 的 update data。
 *
 * 拍貼框改了角度或版面尺寸時要一併重算 box*，否則影片四角會被裁掉 ——
 * schema 的註解說了這件事由 handler 負責，就是這裡。
 */
export function buildUpdateData(
  resource: Resource,
  input: Record<string, unknown>,
  current: Record<string, unknown>,
): Record<string, unknown> {
  if (resource !== "frames") return input;

  const touchesGeometry =
    "rotate" in input || "displayWidth" in input || "displayHeight" in input;
  if (!touchesGeometry) return input;

  // 沒送的欄位沿用現值，三者任一改動都要以最終的組合重算
  const rotate = (input.rotate ?? current.rotate) as number;
  const width = (input.displayWidth ?? current.displayWidth) as number;
  const height = (input.displayHeight ?? current.displayHeight) as number;

  return { ...input, ...boundingBox(width, height, rotate) };
}

/**
 * 回傳給外部的項目形狀。
 *
 * Date 會被 JSON.stringify 轉成 ISO 字串，這裡明確轉一次讓型別誠實。
 * 其餘欄位原樣帶出 —— 資料庫存的就是內容本身，沒有需要隱藏的欄位。
 */
export function serialise(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = value instanceof Date ? value.toISOString() : value;
  }
  return out;
}
