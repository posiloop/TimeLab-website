import { mediaUrl } from "@/app/server/s3";
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
  create(args: {
    data: Record<string, unknown>;
    include?: unknown;
  }): Promise<Record<string, unknown>>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
    include?: unknown;
  }): Promise<Record<string, unknown>>;
  delete(args: { where: { id: string } }): Promise<Record<string, unknown>>;
};

/** 網站上現場照的版面高度，與後台 EventsEditor 的 DISPLAY_HEIGHT 一致 */
export const EVENT_DISPLAY_HEIGHT = 760;

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
 * 拍貼框改了角度時要一併重算 box*，否則影片四角會被裁掉 ——
 * schema 的註解說了這件事由 handler 負責，就是這裡。
 */
export function buildUpdateData(
  resource: Resource,
  input: Record<string, unknown>,
  current: Record<string, unknown>,
): Record<string, unknown> {
  if (resource !== "frames") return input;

  if (!("rotate" in input)) return input;

  // 版面尺寸不開放修改，取現值即可
  const width = current.displayWidth as number;
  const height = current.displayHeight as number;

  return { ...input, ...boundingBox(width, height, input.rotate as number) };
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

const FILE = { select: { key: true, originalName: true } } as const;

/**
 * 讀取項目時一併帶出的檔案。
 *
 * 資料表本身只存 assetId，而後台每張圖都有縮圖與檔名可以辨認 —— 外部呼叫方
 * 若只拿到一串 id，就分不出「第二排那張紅色的」是哪一筆，也沒辦法把圖
 * 給使用者看。所有回傳項目的端點都要帶上這組 include
 */
export const INCLUDE: Record<Resource, Record<string, unknown> | undefined> = {
  hero: { asset: FILE },
  events: { asset: FILE },
  cases: { asset: FILE },
  categories: { cover: FILE },
  frames: { poster: FILE, webm: FILE, mp4: FILE, gif: FILE },
  faq: undefined,
};

type File = { key: string; originalName: string | null } | null;

/**
 * 回傳給外部的項目：資料列本身，加上檔案網址與原始檔名。
 *
 * 關聯物件攤平成 imageUrl／fileName 這類欄位而非原樣輸出 —— 對方要的是
 * 能直接打開的網址，S3 key 要組上網域才有用，這件事不該讓每個呼叫方
 * 各自處理一次
 */
export function present(resource: Resource, row: Record<string, unknown>) {
  const { asset, cover, poster, webm, mp4, gif, ...rest } = row as Record<
    string,
    unknown
  > & { asset?: File; cover?: File; poster?: File; webm?: File; mp4?: File; gif?: File };

  const out = serialise(rest);
  const url = (file: File | undefined) => (file ? mediaUrl(file.key) : null);

  switch (resource) {
    case "hero":
    case "events":
    case "cases":
      out.imageUrl = url(asset);
      out.fileName = asset?.originalName ?? null;
      break;
    case "categories":
      out.coverUrl = url(cover);
      out.coverFileName = cover?.originalName ?? null;
      break;
    case "frames":
      out.posterUrl = url(poster);
      out.webmUrl = url(webm);
      out.mp4Url = url(mp4);
      out.gifUrl = url(gif);
      // 使用者認得的是當初上傳的 GIF 檔名；早期匯入的沒有原檔，退回影片的
      out.fileName = gif?.originalName ?? webm?.originalName ?? null;
      break;
  }
  return out;
}
