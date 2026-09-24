/**
 * 把 public/images/gif/ 的原始 GIF 補進 S3，並接上對應的拍貼框。
 *
 * 五組拍貼框是 seed 匯入的，當時只上傳了轉檔後的 poster/webm/mp4 ——
 * 後台的「下載原始 GIF」因而對它們無效。原檔一直在 repo 裡（720x1073，
 * 未經縮放），比從 610px 的 MP4 轉回來的品質好得多，補上去即可。
 *
 * 靠 slug 與檔名對應（frame-4grid.gif ↔ slug "4grid"）。以 checksum
 * 去重，重跑不會在 S3 留下第二份，也不會覆寫已經有 gifId 的資料。
 *
 * 用法：bun --env-file=.env scripts/backfill-frame-gifs.ts [--dry-run]
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { prisma } from "@/app/server/db";
import { checksumOf, mediaKey, putObject } from "@/app/server/s3";

const DRY_RUN = process.argv.includes("--dry-run");

// import.meta.dir 是 Bun 專屬，用標準的 url 轉換才能通過型別檢查
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GIF_DIR = path.join(ROOT, "public/images/gif");

async function main(): Promise<void> {
  const frames = await prisma.frameAnimation.findMany({
    orderBy: { position: "asc" },
    select: { id: true, slug: true, alt: true, gifId: true },
  });

  for (const frame of frames) {
    const label = `${frame.slug}（${frame.alt}）`;

    if (frame.gifId) {
      console.log(`  略過 ${label} — 已經有原始 GIF`);
      continue;
    }

    const file = path.join(GIF_DIR, `frame-${frame.slug}.gif`);
    let buffer: Buffer;
    try {
      buffer = await readFile(file);
    } catch {
      console.log(`  略過 ${label} — 找不到 ${path.relative(ROOT, file)}`);
      continue;
    }

    const checksum = checksumOf(buffer);
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height) {
      throw new Error(`讀不出尺寸：${path.relative(ROOT, file)}`);
    }

    const key = mediaKey("frames", checksum, "gif");
    const mb = (buffer.byteLength / 1024 / 1024).toFixed(1);
    console.log(
      `  ${label} → ${key}（${mb}MB, ${meta.width}x${meta.height}）`,
    );

    if (DRY_RUN) continue;

    // 同一份檔案可能已經因為別的緣由存在，沿用既有 asset 而非再傳一次
    const existing = await prisma.mediaAsset.findUnique({
      where: { checksum },
      select: { id: true },
    });

    let assetId: string;
    if (existing) {
      console.log("    已有相同內容的 asset，直接沿用");
      assetId = existing.id;
    } else {
      await putObject(key, buffer, "image/gif");
      const created = await prisma.mediaAsset.create({
        data: {
          kind: "IMAGE",
          key,
          intrinsicWidth: meta.width,
          intrinsicHeight: meta.height,
          mimeType: "image/gif",
          byteSize: buffer.byteLength,
          checksum,
          originalName: `frame-${frame.slug}.gif`,
        },
        select: { id: true },
      });
      assetId = created.id;
    }

    await prisma.frameAnimation.update({
      where: { id: frame.id },
      data: { gifId: assetId },
    });
    console.log("    完成");
  }
}

await main();
await prisma.$disconnect();
