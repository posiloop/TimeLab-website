import { prisma } from "@/app/server/db";
import { mediaUrl } from "@/app/server/s3";
import { INCLUDE, type AnyDelegate } from "@/app/api/content/handler";
import { definitionOf, isResource } from "@/app/api/content/schema";

/**
 * 把稽核紀錄的原始資料整理成人看得懂的樣子。
 *
 * 紀錄的 before/after 形狀不一：後台存的是資料列，內容 API 有時存的是
 * 回應本體（{ item }、{ items }），主視覺新增則是三排的陣列。這裡一律
 * 先攤平成單一資料列再比較，只比兩邊都有、且列在 FIELD_LABEL 裡的欄位 ——
 * 其餘（id、時間戳、position、推導出的外框尺寸）對「改了什麼」沒有意義。
 */

type Row = Record<string, unknown>;

type AuditRow = {
  action: string;
  resource: string;
  before: unknown;
  after: unknown;
};

/** 一個看得懂的項目：名稱，能的話附縮圖 */
export type Item = { title: string; thumb?: string };

export type Change = { label: string; before: Item; after: Item };

export type Move = { item: Item; from: number; to: number };

export type Explained = {
  subject?: Item;
  changes?: Change[];
  fields?: { label: string; value: Item }[];
  moves?: Move[];
  note?: string;
};

type Asset = { key: string; originalName: string | null; mimeType: string };

export type Context = {
  assets: Map<string, Asset>;
  /** 排序紀錄裡各 id 目前的樣子，key 為 `${resource}:${id}` */
  current: Map<string, Item>;
};

const FIELD_LABEL: Record<string, string> = {
  question: "問題",
  answer: "答案",
  name: "名稱",
  alt: "描述文字",
  label: "分類名稱",
  tagline: "副標",
  isVisible: "顯示狀態",
  track: "所在排",
  displayWidth: "版面寬度",
  displayHeight: "版面高度",
  rotate: "傾斜角度",
  assetId: "圖片",
  coverId: "封面",
  posterId: "封面圖",
  webmId: "WebM 影片",
  mp4Id: "MP4 影片",
  gifId: "原始 GIF",
};

const MEDIA_FIELDS = ["assetId", "coverId", "posterId", "webmId", "mp4Id", "gifId"];

/** 各資源代表它的那張圖：id 欄位、關聯名、API 回應裡的網址欄位 */
const IMAGE_OF: Record<string, [string, string, string]> = {
  hero: ["assetId", "asset", "imageUrl"],
  events: ["assetId", "asset", "imageUrl"],
  cases: ["assetId", "asset", "imageUrl"],
  categories: ["coverId", "cover", "coverUrl"],
  frames: ["posterId", "poster", "posterUrl"],
};

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** 攤平成單一資料列。主視覺三排內容相同，取第一筆即可代表 */
function unwrap(value: unknown): Row | null {
  if (Array.isArray(value)) return unwrap(value[0]);
  if (!isRow(value)) return null;
  if (isRow(value.item)) return value.item;
  if (Array.isArray(value.items)) return unwrap(value.items[0]);
  return value;
}

const idsOf = (value: unknown): string[] =>
  isRow(value) && Array.isArray(value.ids) ? (value.ids as string[]) : [];

/**
 * 一次查齊整頁要用到的檔案與排序項目，避免每筆紀錄各查一次。
 *
 * 排序項目查的是「現在」的樣子 —— 紀錄只存了 id。已刪除的項目查不到，
 * 會顯示成「已刪除的項目」。
 */
export async function loadContext(logs: AuditRow[]): Promise<Context> {
  const assetIds = new Set<string>();
  const reordered = new Map<string, Set<string>>();

  for (const log of logs) {
    for (const row of [unwrap(log.before), unwrap(log.after)]) {
      for (const field of MEDIA_FIELDS) {
        if (typeof row?.[field] === "string") assetIds.add(row[field]);
      }
    }
    if (log.action === "reorder") {
      const ids = reordered.get(log.resource) ?? new Set<string>();
      for (const id of [...idsOf(log.before), ...idsOf(log.after)]) ids.add(id);
      reordered.set(log.resource, ids);
    }
  }

  const assets = new Map<string, Asset>();
  const found = await prisma.mediaAsset.findMany({
    where: { id: { in: [...assetIds] } },
    select: { id: true, key: true, originalName: true, mimeType: true },
  });
  for (const { id, ...asset } of found) assets.set(id, asset);

  const context: Context = { assets, current: new Map() };

  for (const [resource, ids] of reordered) {
    if (!isResource(resource)) continue;
    const table = prisma[
      definitionOf(resource).model as keyof typeof prisma
    ] as unknown as AnyDelegate;
    const rows = await table.findMany({
      where: { id: { in: [...ids] } },
      include: INCLUDE[resource],
    });
    for (const row of rows) {
      context.current.set(`${resource}:${row.id}`, describe(resource, row, context));
    }
  }

  return context;
}

/** 一筆內容的名稱與縮圖 */
function describe(resource: string, row: Row, context: Context): Item {
  if (resource === "account") {
    const { name, email } = row;
    return { title: name ? `${name}（${email}）` : String(email ?? "") };
  }

  let thumb: string | undefined;
  let fileName: string | undefined;
  const image = IMAGE_OF[resource];
  if (image) {
    const [idField, relation, urlField] = image;
    const related = row[relation] as { key?: string; originalName?: string } | null;
    const asset = context.assets.get(row[idField] as string);
    thumb =
      (row[urlField] as string | undefined) ??
      (row.url as string | undefined) ??
      (related?.key ? mediaUrl(related.key) : undefined) ??
      (asset ? mediaUrl(asset.key) : undefined);
    fileName =
      related?.originalName ??
      (row.fileName as string | undefined) ??
      asset?.originalName ??
      undefined;
  }

  const named: Record<string, unknown> = {
    faq: row.question,
    cases: row.name,
    categories: row.label,
    frames: row.alt,
  };
  const title = named[resource] ?? (row.alt || fileName || "未命名圖片");

  return { title: String(title), thumb };
}

/** 欄位值轉成看得懂的文字；檔案欄位附縮圖 */
function formatValue(field: string, value: unknown, context: Context): Item {
  if (value === null || value === undefined || value === "") {
    return { title: "（無）" };
  }
  if (MEDIA_FIELDS.includes(field)) {
    const asset = context.assets.get(value as string);
    if (!asset) return { title: "（檔案已不存在）" };
    return {
      title: asset.originalName ?? "未命名檔案",
      thumb: asset.mimeType.startsWith("image/") ? mediaUrl(asset.key) : undefined,
    };
  }
  if (field === "isVisible") return { title: value ? "顯示" : "隱藏" };
  if (field === "track") {
    return { title: `第 ${String(value).replace("TRACK_", "")} 排` };
  }
  if (field === "rotate") return { title: `${value}°` };
  return { title: String(value) };
}

/**
 * 找出真正被移動的項目。
 *
 * 把一張圖從第 1 拖到第 12，其餘 11 張的名次都會跟著變，逐一列出只會
 * 淹沒重點。保留新順序裡最長的一段「相對順序沒變」的項目（最長遞增
 * 子序列），剩下的才是被拖動的那幾張
 */
function movesOf(before: string[], after: string[]) {
  const from = new Map(before.map((id, index) => [id, index]));
  const seq = after.map((id) => from.get(id) ?? -1);

  const length = seq.map(() => 1);
  const prev = seq.map(() => -1);
  for (let i = 0; i < seq.length; i++) {
    for (let j = 0; j < i; j++) {
      if (seq[j] < seq[i] && length[j] + 1 > length[i]) {
        length[i] = length[j] + 1;
        prev[i] = j;
      }
    }
  }

  const kept = new Set<number>();
  let end = length.indexOf(Math.max(0, ...length));
  while (end !== -1) {
    kept.add(end);
    end = prev[end];
  }

  return after
    .map((id, index) => ({ id, from: (from.get(id) ?? -1) + 1, to: index + 1 }))
    .filter((_, index) => !kept.has(index));
}

/**
 * 新增／刪除時列出的欄位。略過標題旁縮圖已經表達的那張圖；主視覺另外
 * 略過 track 與 name —— 一次加進三排，只列第一排的會誤導，而後台回傳
 * 的 name 其實是檔名，與標題重複
 */
function labelledFields(resource: string, row: Row, context: Context) {
  const hidden = new Set([
    IMAGE_OF[resource]?.[0],
    ...(resource === "hero" ? ["track", "name"] : []),
  ]);
  return Object.keys(FIELD_LABEL)
    .filter((field) => !hidden.has(field))
    .filter((field) => row[field] !== undefined && row[field] !== null)
    .map((field) => ({
      label: FIELD_LABEL[field],
      value: formatValue(field, row[field], context),
    }));
}

export function explain(log: AuditRow, context: Context): Explained {
  const before = unwrap(log.before);
  const after = unwrap(log.after);

  if (log.action === "reorder") {
    const moves = movesOf(idsOf(log.before), idsOf(log.after)).map((move) => ({
      item: context.current.get(`${log.resource}:${move.id}`) ?? {
        title: "已刪除的項目",
      },
      from: move.from,
      to: move.to,
    }));
    return moves.length ? { moves } : { note: "順序沒有變動" };
  }

  if (log.resource === "account") {
    if (log.action === "change-password") return { note: "修改了自己的密碼" };
    const row = after ?? before;
    return { subject: row ? describe("account", row, context) : undefined };
  }

  if (log.action === "update" || log.action === "replace-media") {
    const subject = describe(log.resource, after ?? before ?? {}, context);
    if (!before || !after) return { subject };

    const changes = Object.keys(FIELD_LABEL)
      .filter(
        (field) =>
          field in before &&
          field in after &&
          JSON.stringify(before[field]) !== JSON.stringify(after[field]),
      )
      .map((field) => ({
        label: FIELD_LABEL[field],
        before: formatValue(field, before[field], context),
        after: formatValue(field, after[field], context),
      }));

    return changes.length
      ? { subject, changes }
      : { subject, note: "沒有實際變更（只重新存檔）" };
  }

  // 新增看 after、刪除看 before
  const row = log.action === "delete" ? before : after;
  if (!row) return {};
  return {
    subject: describe(log.resource, row, context),
    fields: labelledFields(log.resource, row, context),
  };
}
