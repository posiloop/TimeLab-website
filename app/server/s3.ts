import { createHash } from "node:crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// 媒體檔案的公開網址前綴（CloudFront）。bucket 全私有，只允許 CDN 的
// Origin Access Control 讀取，故前台一律走這個網域而非 S3 直連
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL ?? "";

let client: S3Client | undefined;

/** 延遲建立：讀取層只組網址不碰 S3，不該因為缺金鑰就無法啟動 */
function s3(): S3Client {
  if (!client) {
    const region = process.env.AWS_REGION;
    if (!region) throw new Error("缺少環境變數 AWS_REGION");
    client = new S3Client({ region });
  }
  return client;
}

function bucket(): string {
  const name = process.env.S3_BUCKET;
  if (!name) throw new Error("缺少環境變數 S3_BUCKET");
  return name;
}

/** 把 S3 key 組成公開網址。組合邏輯只在這裡，換 CDN 網域時不必改資料 */
export function mediaUrl(key: string): string {
  return `${MEDIA_BASE}/${key}`;
}

export function checksumOf(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * 產生內容定址的 S3 key。
 *
 * 不用原檔名的兩個理由：一是內容定址讓 key 天然不可變，可設
 * `max-age=31536000, immutable`，換圖時產生新 key 而非覆寫舊檔，
 * 不會有 CDN 快取殘留導致「後台換了圖、網站還是舊圖」；
 * 二是避免管理員上傳同名檔互相覆蓋。
 * 中段的 folder 純粹讓 S3 console 裡肉眼可辨，程式不依賴它。
 */
export function mediaKey(
  folder: string,
  checksum: string,
  ext: string,
): string {
  return `media/${folder}/${checksum.slice(0, 16)}.${ext}`;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      // key 含內容雜湊，同一個 key 的內容永不改變，故可永久快取
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}
