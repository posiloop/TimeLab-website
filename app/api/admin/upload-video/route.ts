import { NextResponse } from "next/server";
import { getSessionFrom } from "@/app/server/admin-guard";
import { prisma } from "@/app/server/db";
import { convertGif } from "@/app/server/gif-to-video";
import { checksumOf, mediaKey, mediaUrl, putObject } from "@/app/server/s3";

export const runtime = "nodejs";

/** GIF 未經壓縮，原始素材約 5–10MB；40MB 已留足餘裕 */
const MAX_BYTES = 40 * 1024 * 1024;

/**
 * 拍貼框動畫上傳：收一個 GIF，轉成網頁用的三個檔案。
 *
 * 後台只讓使用者準備一個 GIF，其餘由伺服器處理 —— 要他們自備 WebM、
 * MP4 與封面圖三個檔案太容易出錯，而 GIF 直接上站又太肥
 *（五組原檔共 30MB，轉檔後 1.5MB）。
 *
 * 走 route handler 而非 server action：後者 body 上限 1MB，GIF 必定超過。
 */
export async function POST(request: Request) {
  const session = await getSessionFrom(request);
  if (!session) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "沒有收到檔案" }, { status: 400 });
  }
  if (file.type !== "image/gif") {
    return NextResponse.json(
      { error: "請上傳 GIF 動圖檔" },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return NextResponse.json(
      { error: `檔案 ${mb}MB，超過 40MB 上限` },
      { status: 413 },
    );
  }

  const gif = Buffer.from(await file.arrayBuffer());

  let converted;
  try {
    converted = await convertGif(gif);
  } catch (error) {
    // 轉檔失敗的原因（ffmpeg 未安裝、檔案損毀）對使用者有意義，照實回傳
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "GIF 轉檔失敗，請確認檔案",
      },
      { status: 422 },
    );
  }

  const { width, height } = converted;

  /** 三個產出各自建立或複用 asset。以內容雜湊去重，重複上傳同一個 GIF
      不會在 S3 留下第二份 */
  const store = async (
    buffer: Buffer,
    ext: string,
    mimeType: string,
    originalName: string,
  ) => {
    const checksum = checksumOf(buffer);
    const existing = await prisma.mediaAsset.findUnique({
      where: { checksum },
    });
    if (existing) return existing;

    const key = mediaKey("frames", checksum, ext);
    await putObject(key, buffer, mimeType);

    return prisma.mediaAsset.create({
      data: {
        kind: mimeType.startsWith("video/") ? "VIDEO" : "IMAGE",
        key,
        intrinsicWidth: width,
        intrinsicHeight: height,
        mimeType,
        byteSize: buffer.byteLength,
        checksum,
        originalName,
        uploadedById: session.user.id,
      },
    });
  };

  // 副檔名前的原始檔名保留下來，後台才看得出這三個檔案同源
  const base = file.name.replace(/\.gif$/i, "");

  const [poster, webm, mp4] = await Promise.all([
    store(converted.poster, "jpg", "image/jpeg", `${base}-poster.jpg`),
    store(converted.webm, "webm", "video/webm", `${base}.webm`),
    store(converted.mp4, "mp4", "video/mp4", `${base}.mp4`),
  ]);

  return NextResponse.json({
    posterId: poster.id,
    webmId: webm.id,
    mp4Id: mp4.id,
    posterUrl: mediaUrl(poster.key),
    width,
    height,
    // 讓後台顯示「30MB 的 GIF 轉成 1.5MB」這類回饋
    originalBytes: file.size,
    convertedBytes:
      converted.webm.byteLength +
      converted.mp4.byteLength +
      converted.poster.byteLength,
  });
}
