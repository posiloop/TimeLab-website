/**
 * 把現有的靜態內容（app/data/*.ts 與 public/ 下的圖片影片）遷移進資料庫與 S3。
 *
 * 執行：bun run seed:content
 *       bun run seed:content -- --dry-run   （只做檢查與尺寸讀取，不寫入）
 *
 * 設計要點：
 * - 冪等：以檔案的 sha256 去重，重跑不會重傳 137 個檔案，也不會重複建列
 * - fail fast：Stage 0 先驗完所有前置條件，錯了就中止，不留半套資料
 * - 自我驗證：Stage 6 把資料讀回來與凍結快照逐欄位比對，全綠才算成功
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { prisma } from "../../app/server/db";
import { checksumOf, mediaKey, putObject } from "../../app/server/s3";
import {
  CASE_CATEGORIES,
  CASE_ITEMS,
  EVENT_HEIGHT,
  EVENT_TRACK_BY_PREFIX,
  EVENT_WIDTHS,
  FAQ_ITEMS,
  FRAMES,
  HERO_DISPLAY,
  HERO_ORDERS,
} from "./source/snapshot";

const DRY_RUN = process.argv.includes("--dry-run");
// import.meta.dir 是 Bun 專屬，用標準的 url 轉換才能通過型別檢查
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PUBLIC = path.join(ROOT, "public");

/** 排序採間隔 1000 的稀疏配置，讓之後拖拉插入時多半只需改一列 */
const STEP = 1000;

type Problem = string;
const problems: Problem[] = [];
const note = (msg: string) => console.log(`  ${msg}`);

// ---------------------------------------------------------------------------
// 路徑輔助
// ---------------------------------------------------------------------------

const rollPath = (n: number) =>
  path.join(PUBLIC, "images/roll", `roll-${String(n).padStart(2, "0")}.png`);

const eventPath = (prefix: string, no: string) =>
  path.join(PUBLIC, "images/event", `${prefix}-${no}.jpg`);

const casePath = (file: string) =>
  path.join(PUBLIC, "images/cases", `${file}.jpg`);

const coverPath = (slug: string) =>
  path.join(PUBLIC, "images/case-covers", `${slug}.jpg`);

const videoPath = (name: string) => path.join(PUBLIC, "videos", name);

// ---------------------------------------------------------------------------
// Stage 0 — 前置檢查
// ---------------------------------------------------------------------------

async function stage0(): Promise<void> {
  console.log("\n[Stage 0] 前置檢查");

  const required: string[] = [
    ...Array.from({ length: 12 }, (_, i) => rollPath(i + 1)),
    ...Object.entries(EVENT_WIDTHS).flatMap(([prefix, widths]) =>
      Object.keys(widths).map((no) => eventPath(prefix, no)),
    ),
    ...Object.values(CASE_ITEMS).flat().map((item) => casePath(item.file)),
    ...CASE_CATEGORIES.map((category) => coverPath(category.slug)),
    ...FRAMES.flatMap((frame) => [
      videoPath(`frame-${frame.slug}-poster.jpg`),
      videoPath(`frame-${frame.slug}.webm`),
      videoPath(`frame-${frame.slug}.mp4`),
    ]),
  ];

  const missing = required.filter((file) => !existsSync(file));
  if (missing.length > 0) {
    for (const file of missing) {
      problems.push(`缺少檔案：${path.relative(ROOT, file)}`);
    }
  }
  note(`檔案存在性：${required.length - missing.length}/${required.length}`);

  // 案例圖必須與快照嚴格雙向一對一 —— 多一張代表快照漏記，
  // 少一張代表遷移後網站會缺圖
  const { readdir } = await import("node:fs/promises");
  const onDisk = (await readdir(path.join(PUBLIC, "images/cases")))
    .filter((name) => name.endsWith(".jpg"))
    .map((name) => name.replace(/\.jpg$/, ""))
    .sort();
  const inSnapshot = Object.values(CASE_ITEMS)
    .flat()
    .map((item) => item.file)
    .sort();

  const orphans = onDisk.filter((f) => !inSnapshot.includes(f));
  const ghosts = inSnapshot.filter((f) => !onDisk.includes(f));
  for (const f of orphans) problems.push(`案例圖有檔案但快照沒記錄：${f}.jpg`);
  for (const f of ghosts) problems.push(`快照有記錄但找不到檔案：${f}.jpg`);
  note(`案例圖一對一：磁碟 ${onDisk.length}、快照 ${inSnapshot.length}`);

  // 活動照的寬度是版面依據，與檔案真實像素不符就會整排歪掉
  let widthChecked = 0;
  for (const [prefix, widths] of Object.entries(EVENT_WIDTHS)) {
    for (const [no, expected] of Object.entries(widths)) {
      const file = eventPath(prefix, no);
      if (!existsSync(file)) continue;
      const meta = await sharp(file).metadata();
      if (meta.width !== expected) {
        problems.push(
          `活動照 ${prefix}-${no} 寬度不符：快照 ${expected}、實際 ${meta.width}`,
        );
      }
      if (meta.height !== EVENT_HEIGHT) {
        problems.push(
          `活動照 ${prefix}-${no} 高度不符：預期 ${EVENT_HEIGHT}、實際 ${meta.height}`,
        );
      }
      widthChecked++;
    }
  }
  note(`活動照尺寸比對：${widthChecked} 張`);

  if (problems.length > 0) {
    console.error("\n前置檢查未通過：");
    for (const p of problems) console.error(`  ✗ ${p}`);
    throw new Error("Stage 0 失敗，已中止，資料庫未被修改");
  }
  note("✓ 全部通過");
}

// ---------------------------------------------------------------------------
// Stage 1 — 上傳並建立 MediaAsset
// ---------------------------------------------------------------------------

/** 檔案絕對路徑 → MediaAsset.id */
const assetIds = new Map<string, string>();

const VIDEO_MIME: Record<string, string> = {
  ".webm": "video/webm",
  ".mp4": "video/mp4",
};

const IMAGE_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * 上傳單一檔案並建立（或複用）MediaAsset。
 *
 * fallbackSize 供影片使用：sharp 讀不到 webm/mp4 的尺寸，而這兩個欄位對
 * 影片並不參與任何渲染決策（版面吃的是 FrameAnimation.display*），
 * 故沿用同組 poster 的尺寸，不為此引入 ffprobe。
 */
async function ingest(
  file: string,
  folder: string,
  fallbackSize?: { width: number; height: number },
): Promise<string> {
  const cached = assetIds.get(file);
  if (cached) return cached;

  const buffer = await readFile(file);
  const checksum = checksumOf(buffer);
  const ext = path.extname(file).toLowerCase();
  const isVideo = ext in VIDEO_MIME;

  let width: number;
  let height: number;

  if (isVideo) {
    if (!fallbackSize) throw new Error(`影片缺少備用尺寸：${file}`);
    width = fallbackSize.width;
    height = fallbackSize.height;
  } else {
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height) {
      throw new Error(`讀不出尺寸：${path.relative(ROOT, file)}`);
    }
    // EXIF orientation 5~8 代表影像以旋轉 90 度的形式存檔，
    // metadata 回的是未套用方向的原始值，需對調才是顯示時的實際比例
    const rotated = (meta.orientation ?? 1) >= 5;
    width = rotated ? meta.height : meta.width;
    height = rotated ? meta.width : meta.height;
  }

  const mime = isVideo ? VIDEO_MIME[ext] : (IMAGE_MIME[ext] ?? "image/jpeg");
  const key = mediaKey(folder, checksum, ext.slice(1));

  if (DRY_RUN) {
    assetIds.set(file, `dry-run:${checksum.slice(0, 8)}`);
    return assetIds.get(file)!;
  }

  // 以 checksum 去重：重跑時同一個檔案不會再傳一次，也不會建第二列
  const existing = await prisma.mediaAsset.findUnique({ where: { checksum } });
  if (existing) {
    assetIds.set(file, existing.id);
    return existing.id;
  }

  await putObject(key, buffer, mime);

  const asset = await prisma.mediaAsset.create({
    data: {
      kind: isVideo ? "VIDEO" : "IMAGE",
      key,
      intrinsicWidth: width,
      intrinsicHeight: height,
      mimeType: mime,
      byteSize: buffer.byteLength,
      checksum,
      originalName: path.basename(file),
    },
  });

  assetIds.set(file, asset.id);
  return asset.id;
}

async function stage1(): Promise<void> {
  console.log("\n[Stage 1] 上傳檔案並建立 MediaAsset");

  for (let n = 1; n <= 12; n++) await ingest(rollPath(n), "hero");
  note(`主視覺相框：12`);

  let eventCount = 0;
  for (const [prefix, widths] of Object.entries(EVENT_WIDTHS)) {
    for (const no of Object.keys(widths)) {
      await ingest(eventPath(prefix, no), "event");
      eventCount++;
    }
  }
  note(`活動現場照：${eventCount}`);

  for (const frame of FRAMES) {
    const poster = videoPath(`frame-${frame.slug}-poster.jpg`);
    await ingest(poster, "frames");
    // 影片沿用 poster 的真實像素（五組 poster 皆為 610x910）
    const meta = await sharp(poster).metadata();
    const size = { width: meta.width!, height: meta.height! };
    await ingest(videoPath(`frame-${frame.slug}.webm`), "frames", size);
    await ingest(videoPath(`frame-${frame.slug}.mp4`), "frames", size);
  }
  note(`拍貼框動畫：${FRAMES.length} 組共 ${FRAMES.length * 3} 檔`);

  for (const category of CASE_CATEGORIES) {
    await ingest(coverPath(category.slug), "case-covers");
  }
  note(`分類縮圖：${CASE_CATEGORIES.length}`);

  let caseCount = 0;
  for (const items of Object.values(CASE_ITEMS)) {
    for (const item of items) {
      await ingest(casePath(item.file), "cases");
      caseCount++;
    }
  }
  note(`案例圖：${caseCount}`);
}

// ---------------------------------------------------------------------------
// Stage 2 — 首頁主視覺三軌
// ---------------------------------------------------------------------------

async function stage2(): Promise<void> {
  console.log("\n[Stage 2] 首頁主視覺三軌");
  if (DRY_RUN) return note("(dry-run 略過)");

  if ((await prisma.heroSlide.count()) > 0) {
    return note("已有資料，略過");
  }

  for (const [track, order] of Object.entries(HERO_ORDERS)) {
    for (const [index, n] of order.entries()) {
      await prisma.heroSlide.create({
        data: {
          track: track as "TRACK_1" | "TRACK_2" | "TRACK_3",
          assetId: assetIds.get(rollPath(n))!,
          position: (index + 1) * STEP,
          // 刻意寫死常數而非讀 asset.intrinsicWidth：12 張原檔有三種尺寸，
          // 跟著檔案走會讓相框寬度出現次像素差
          displayWidth: HERO_DISPLAY.width,
          displayHeight: HERO_DISPLAY.height,
        },
      });
    }
  }
  note(`建立 ${Object.keys(HERO_ORDERS).length * 12} 列`);
}

// ---------------------------------------------------------------------------
// Stage 3 — 底部活動現場照三軌
// ---------------------------------------------------------------------------

async function stage3(): Promise<void> {
  console.log("\n[Stage 3] 活動現場照三軌");
  if (DRY_RUN) return note("(dry-run 略過)");

  if ((await prisma.eventPhoto.count()) > 0) {
    return note("已有資料，略過");
  }

  let created = 0;
  for (const [prefix, widths] of Object.entries(EVENT_WIDTHS)) {
    const entries = Object.entries(widths);
    for (const [index, [no, width]] of entries.entries()) {
      await prisma.eventPhoto.create({
        data: {
          track: EVENT_TRACK_BY_PREFIX[prefix as keyof typeof EVENT_TRACK_BY_PREFIX],
          assetId: assetIds.get(eventPath(prefix, no))!,
          position: (index + 1) * STEP,
          displayWidth: width,
          displayHeight: EVENT_HEIGHT,
        },
      });
      created++;
    }
  }
  note(`建立 ${created} 列`);
}

// ---------------------------------------------------------------------------
// Stage 4 — 拍貼框動畫
// ---------------------------------------------------------------------------

async function stage4(): Promise<void> {
  console.log("\n[Stage 4] 拍貼框動畫");
  if (DRY_RUN) return note("(dry-run 略過)");

  if ((await prisma.frameAnimation.count()) > 0) {
    return note("已有資料，略過");
  }

  for (const [index, frame] of FRAMES.entries()) {
    await prisma.frameAnimation.create({
      data: {
        slug: frame.slug,
        alt: frame.alt,
        posterId: assetIds.get(videoPath(`frame-${frame.slug}-poster.jpg`))!,
        webmId: assetIds.get(videoPath(`frame-${frame.slug}.webm`))!,
        mp4Id: assetIds.get(videoPath(`frame-${frame.slug}.mp4`))!,
        displayWidth: frame.width,
        displayHeight: frame.height,
        rotate: frame.rotate,
        boxWidth: frame.boxWidth,
        boxHeight: frame.boxHeight,
        position: (index + 1) * STEP,
      },
    });
  }
  note(`建立 ${FRAMES.length} 組`);
}

// ---------------------------------------------------------------------------
// Stage 5 — 活動案例與常見問題
// ---------------------------------------------------------------------------

async function stage5(): Promise<void> {
  console.log("\n[Stage 5] 活動案例與常見問題");
  if (DRY_RUN) return note("(dry-run 略過)");

  if ((await prisma.caseCategory.count()) === 0) {
    for (const [index, category] of CASE_CATEGORIES.entries()) {
      const created = await prisma.caseCategory.create({
        data: {
          slug: category.slug,
          label: category.label,
          tagline: category.tagline,
          coverId: assetIds.get(coverPath(category.slug))!,
          position: (index + 1) * STEP,
        },
      });

      const items = CASE_ITEMS[category.slug] ?? [];
      for (const [itemIndex, item] of items.entries()) {
        await prisma.caseItem.create({
          data: {
            categoryId: created.id,
            assetId: assetIds.get(casePath(item.file))!,
            name: item.name,
            figmaNodeId: item.nodeId,
            position: (itemIndex + 1) * STEP,
          },
        });
      }
    }
    const total = Object.values(CASE_ITEMS).flat().length;
    note(`建立 ${CASE_CATEGORIES.length} 分類、${total} 案例`);
  } else {
    note("案例已有資料，略過");
  }

  if ((await prisma.faqItem.count()) === 0) {
    for (const [index, faq] of FAQ_ITEMS.entries()) {
      await prisma.faqItem.create({
        data: {
          question: faq.question,
          answer: faq.answer,
          position: (index + 1) * STEP,
        },
      });
    }
    note(`建立 ${FAQ_ITEMS.length} 筆常見問題`);
  } else {
    note("常見問題已有資料，略過");
  }
}

// ---------------------------------------------------------------------------
// Stage 6 — 驗證
// ---------------------------------------------------------------------------

/**
 * 逐欄位比對，刻意不用 JSON.stringify：物件的 key 順序不同會讓完全正確的
 * 資料被報成全數不符，而滿螢幕的「不符」會誘使人去查搬遷邏輯，
 * 但錯的其實是驗證方法。
 */
async function stage6(): Promise<void> {
  console.log("\n[Stage 6] 驗證");
  if (DRY_RUN) return note("(dry-run 略過)");

  const diffs: string[] = [];
  const expect = (ok: boolean, msg: string) => {
    if (!ok) diffs.push(msg);
  };

  // 主視覺：三軌順序必須與快照逐張相同
  for (const [track, order] of Object.entries(HERO_ORDERS)) {
    const slides = await prisma.heroSlide.findMany({
      where: { track: track as "TRACK_1" },
      orderBy: { position: "asc" },
      select: { displayWidth: true, displayHeight: true, asset: { select: { originalName: true } } },
    });
    expect(slides.length === order.length, `${track} 張數 ${slides.length}/${order.length}`);
    order.forEach((n, i) => {
      const want = `roll-${String(n).padStart(2, "0")}.png`;
      expect(slides[i]?.asset.originalName === want,
        `${track}[${i}] 應為 ${want}，實為 ${slides[i]?.asset.originalName}`);
      expect(slides[i]?.displayWidth === HERO_DISPLAY.width,
        `${track}[${i}] 寬應為 ${HERO_DISPLAY.width}，實為 ${slides[i]?.displayWidth}`);
    });
  }

  // 活動照：每張的寬度必須與快照相同，這是版面的依據
  for (const [prefix, widths] of Object.entries(EVENT_WIDTHS)) {
    const track = EVENT_TRACK_BY_PREFIX[prefix as keyof typeof EVENT_TRACK_BY_PREFIX];
    const photos = await prisma.eventPhoto.findMany({
      where: { track },
      orderBy: { position: "asc" },
      select: { displayWidth: true, displayHeight: true, asset: { select: { originalName: true } } },
    });
    const entries = Object.entries(widths);
    expect(photos.length === entries.length, `${track} 張數 ${photos.length}/${entries.length}`);
    entries.forEach(([no, width], i) => {
      expect(photos[i]?.asset.originalName === `${prefix}-${no}.jpg`,
        `${track}[${i}] 檔名不符`);
      expect(photos[i]?.displayWidth === width,
        `${track}[${i}] 寬應為 ${width}，實為 ${photos[i]?.displayWidth}`);
      expect(photos[i]?.displayHeight === EVENT_HEIGHT, `${track}[${i}] 高不符`);
    });
  }

  // 拍貼框：五個版面參數逐組比對
  const frames = await prisma.frameAnimation.findMany({ orderBy: { position: "asc" } });
  expect(frames.length === FRAMES.length, `拍貼框組數 ${frames.length}/${FRAMES.length}`);
  FRAMES.forEach((want, i) => {
    const got = frames[i];
    if (!got) return expect(false, `拍貼框[${i}] 缺`);
    expect(got.slug === want.slug, `拍貼框[${i}] slug ${got.slug}/${want.slug}`);
    expect(got.alt === want.alt, `拍貼框[${i}] alt`);
    expect(got.displayWidth === want.width, `拍貼框[${i}] width ${got.displayWidth}/${want.width}`);
    expect(got.displayHeight === want.height, `拍貼框[${i}] height`);
    expect(got.rotate === want.rotate, `拍貼框[${i}] rotate ${got.rotate}/${want.rotate}`);
    expect(got.boxWidth === want.boxWidth, `拍貼框[${i}] boxWidth`);
    expect(got.boxHeight === want.boxHeight, `拍貼框[${i}] boxHeight`);
  });

  // 案例：分類順序、每張圖的檔名與顯示名稱
  const categories = await prisma.caseCategory.findMany({
    orderBy: { position: "asc" },
    include: { items: { orderBy: { position: "asc" }, include: { asset: true } } },
  });
  expect(categories.length === CASE_CATEGORIES.length, `分類數 ${categories.length}`);
  CASE_CATEGORIES.forEach((want, i) => {
    const got = categories[i];
    if (!got) return expect(false, `分類[${i}] 缺`);
    expect(got.slug === want.slug, `分類[${i}] slug ${got.slug}/${want.slug}`);
    expect(got.label === want.label, `分類[${i}] label`);
    expect(got.tagline === want.tagline, `分類[${i}] tagline`);

    const wantItems = CASE_ITEMS[want.slug] ?? [];
    expect(got.items.length === wantItems.length,
      `${want.slug} 案例數 ${got.items.length}/${wantItems.length}`);
    wantItems.forEach((wantItem, j) => {
      const gotItem = got.items[j];
      if (!gotItem) return expect(false, `${want.slug}[${j}] 缺`);
      expect(gotItem.asset.originalName === `${wantItem.file}.jpg`,
        `${want.slug}[${j}] 檔名 ${gotItem.asset.originalName}/${wantItem.file}.jpg`);
      expect(gotItem.name === wantItem.name, `${want.slug}[${j}] 名稱`);
      expect(gotItem.figmaNodeId === wantItem.nodeId, `${want.slug}[${j}] nodeId`);
    });
  });

  // 常見問題：問與答的字串必須一字不差
  const faqs = await prisma.faqItem.findMany({ orderBy: { position: "asc" } });
  expect(faqs.length === FAQ_ITEMS.length, `FAQ 數 ${faqs.length}/${FAQ_ITEMS.length}`);
  FAQ_ITEMS.forEach((want, i) => {
    expect(faqs[i]?.question === want.question, `FAQ[${i}] 問題`);
    expect(faqs[i]?.answer === want.answer, `FAQ[${i}] 答案`);
  });

  if (diffs.length > 0) {
    console.error(`\n✗ 驗證發現 ${diffs.length} 處不符：`);
    for (const d of diffs) console.error(`    ${d}`);
    throw new Error("Stage 6 驗證失敗");
  }
  note("✓ 全部相符，遷移後的內容與遷移前完全一致");
}

// ---------------------------------------------------------------------------

async function main() {
  console.log(DRY_RUN ? "=== 遷移（dry-run，不寫入） ===" : "=== 遷移內容至資料庫與 S3 ===");

  await stage0();
  await stage1();
  await stage2();
  await stage3();
  await stage4();
  await stage5();
  await stage6();

  console.log("\n完成。\n");
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(`\n${error instanceof Error ? error.message : error}`);
  await prisma.$disconnect();
  process.exit(1);
});
