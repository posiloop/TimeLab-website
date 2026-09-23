import { NextResponse } from "next/server";
import sharp from "sharp";
import { getSessionFrom } from "@/app/server/admin-guard";
import { prisma } from "@/app/server/db";
import { checksumOf, mediaKey, mediaUrl, putObject } from "@/app/server/s3";

// sharp 是原生模組，不能跑在 edge runtime。Next 16 的 route handler 預設
// 就是 nodejs，明寫出來是避免日後被改動時靜默失效
export const runtime = "nodejs";

/** 1140x760 的高品質 JPG 約 2MB，12MB 已留足餘裕 */
const MAX_BYTES = 12 * 1024 * 1024;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

/** sharp 回報的格式 → 副檔名 */
const EXT_BY_FORMAT: Record<string, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
};

/** 上傳目的地，決定 S3 key 的中段。限制白名單避免被塞進任意路徑 */
const FOLDERS = new Set(["hero", "event", "cases", "case-covers", "frames"]);

/**
 * 圖片上傳。
 *
 * 走 route handler 而非 server action 有兩個硬理由：server action 的
 * request body 上限 1MB，這裡的圖片幾乎都會超過；且 client 呼叫 server
 * action 是序列的，一次傳 84 張會排隊。
 */
export async function POST(request: Request) {
  const session = await getSessionFrom(request);
  if (!session) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "沒有收到檔案" }, { status: 400 });
  }
  if (!FOLDERS.has(folder)) {
    return NextResponse.json({ error: "上傳目的地不正確" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return NextResponse.json(
      { error: `檔案 ${mb}MB，超過 12MB 上限` },
      { status: 413 },
    );
  }
  // MIME 由瀏覽器提供、可被偽造，這只是第一道快速篩選；
  // 真正的把關是下面 sharp 解不開就拒絕
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "只接受 JPG、PNG 或 WebP" },
      { status: 415 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let meta;
  try {
    // 尺寸必須由伺服器認定，不能信前端傳來的值 ——
    // 活動現場照三軌的版面寬度直接吃這個數字，錯了整排會歪
    meta = await sharp(buffer).metadata();
  } catch {
    return NextResponse.json(
      { error: "這不是有效的圖片檔" },
      { status: 415 },
    );
  }

  if (!meta.width || !meta.height) {
    return NextResponse.json({ error: "讀不出圖片尺寸" }, { status: 415 });
  }

  // EXIF orientation 5~8 代表影像以旋轉 90 度的形式存檔，metadata 回的是
  // 未套用方向的原始值。手機拍的直式照片會落在這個範圍，不對調的話
  // 寬高會顛倒，版面直接歪掉
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;

  const checksum = checksumOf(buffer);

  // 內容相同就複用既有 asset，不重複佔用 S3 空間
  const existing = await prisma.mediaAsset.findUnique({ where: { checksum } });
  if (existing) {
    return NextResponse.json({
      id: existing.id,
      url: mediaUrl(existing.key),
      width: existing.intrinsicWidth,
      height: existing.intrinsicHeight,
      reused: true,
    });
  }

  const ext = EXT_BY_FORMAT[meta.format ?? ""] ?? "jpg";
  const key = mediaKey(folder, checksum, ext);

  await putObject(key, buffer, file.type);

  const asset = await prisma.mediaAsset.create({
    data: {
      kind: "IMAGE",
      key,
      intrinsicWidth: width,
      intrinsicHeight: height,
      mimeType: file.type,
      byteSize: buffer.byteLength,
      checksum,
      originalName: file.name,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json({
    id: asset.id,
    url: mediaUrl(asset.key),
    width: asset.intrinsicWidth,
    height: asset.intrinsicHeight,
    reused: false,
  });
}
