import { NextResponse } from "next/server";
import sharp from "sharp";
import { getSessionFrom } from "@/app/server/admin-guard";
import { prisma } from "@/app/server/db";
import { checksumOf, mediaKey, mediaUrl, putObject } from "@/app/server/s3";

export const runtime = "nodejs";

/** 現有五支影片最大 335KB，30MB 對重新製作的素材已相當寬裕 */
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
const MAX_POSTER_BYTES = 12 * 1024 * 1024;

/**
 * 拍貼框動畫上傳：WebM、MP4 與封面圖三個檔一次送。
 *
 * 綁在同一個請求而非分三次，是因為三者必須同時成立 —— 只傳了 WebM 而
 * MP4 失敗的話，Safari 就播不出來，卻不會有任何錯誤訊息。分開上傳會在
 * 中途失敗時留下半殘的記錄。
 */
export async function POST(request: Request) {
  const session = await getSessionFrom(request);
  if (!session) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const form = await request.formData();
  const webm = form.get("webm");
  const mp4 = form.get("mp4");
  const poster = form.get("poster");

  if (
    !(webm instanceof File) ||
    !(mp4 instanceof File) ||
    !(poster instanceof File)
  ) {
    return NextResponse.json(
      { error: "需要同時提供 WebM、MP4 與封面圖三個檔案" },
      { status: 400 },
    );
  }
  if (webm.type !== "video/webm") {
    return NextResponse.json({ error: "第一個檔案須為 WebM" }, { status: 415 });
  }
  if (mp4.type !== "video/mp4") {
    return NextResponse.json({ error: "第二個檔案須為 MP4" }, { status: 415 });
  }
  if (webm.size > MAX_VIDEO_BYTES || mp4.size > MAX_VIDEO_BYTES) {
    return NextResponse.json(
      { error: "影片檔超過 30MB 上限" },
      { status: 413 },
    );
  }
  if (poster.size > MAX_POSTER_BYTES) {
    return NextResponse.json({ error: "封面圖超過 12MB" }, { status: 413 });
  }

  const posterBuffer = Buffer.from(await poster.arrayBuffer());

  let posterMeta;
  try {
    posterMeta = await sharp(posterBuffer).metadata();
  } catch {
    return NextResponse.json(
      { error: "封面圖不是有效的圖片檔" },
      { status: 415 },
    );
  }
  if (!posterMeta.width || !posterMeta.height) {
    return NextResponse.json({ error: "讀不出封面圖尺寸" }, { status: 415 });
  }

  /** 建立或複用一個 asset。影片沿用封面圖的尺寸 —— 這兩個欄位對影片而言
      不參與渲染決策（版面吃的是 FrameAnimation.display*），不值得為此
      引入 ffprobe 這類原生相依 */
  const ingest = async (
    file: File,
    buffer: Buffer,
    ext: string,
    width: number,
    height: number,
  ) => {
    const checksum = checksumOf(buffer);
    const existing = await prisma.mediaAsset.findUnique({
      where: { checksum },
    });
    if (existing) return existing;

    const key = mediaKey("frames", checksum, ext);
    await putObject(key, buffer, file.type);

    return prisma.mediaAsset.create({
      data: {
        kind: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
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
  };

  const width = posterMeta.width;
  const height = posterMeta.height;

  const posterAsset = await ingest(poster, posterBuffer, "jpg", width, height);
  const webmAsset = await ingest(
    webm,
    Buffer.from(await webm.arrayBuffer()),
    "webm",
    width,
    height,
  );
  const mp4Asset = await ingest(
    mp4,
    Buffer.from(await mp4.arrayBuffer()),
    "mp4",
    width,
    height,
  );

  return NextResponse.json({
    posterId: posterAsset.id,
    webmId: webmAsset.id,
    mp4Id: mp4Asset.id,
    posterUrl: mediaUrl(posterAsset.key),
    width,
    height,
  });
}
