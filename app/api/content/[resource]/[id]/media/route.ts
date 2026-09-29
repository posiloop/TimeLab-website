import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyApiKey } from "@/app/server/api-key";
import { prisma } from "@/app/server/db";
import { revalidateContent } from "@/app/server/content/revalidate";
import { definitionOf, isResource, resourceList, type Resource } from "../../../schema";
import { serialise } from "../../../handler";

export const runtime = "nodejs";

/**
 * 更換項目的圖片或影片。
 *
 * PUT /api/content/<resource>/<id>/media
 *   hero / events / cases / categories   { "assetId": "…" }
 *   frames   { "posterId": "…", "webmId": "…", "mp4Id": "…", "gifId": "…" }
 *
 * 新檔案要先透過上傳端點取得 id。舊檔案不會刪除，與後台的更換封面、
 * 更換動畫一致 —— 換錯了可以換回來，檔案本身不會因此消失。
 *
 * 另開一個端點而非放進 PATCH：換圖會連帶影響版面尺寸與其他軌，
 * 規則和改文字差很多，混在同一個白名單裡容易漏掉這些連帶效果。
 */

const singleSchema = z.object({ assetId: z.string().min(1) });

const frameSchema = z.object({
  posterId: z.string().min(1),
  webmId: z.string().min(1),
  mp4Id: z.string().min(1),
  // 選填：沒給就清掉舊的原始 GIF。留著會讓後台「下載原始 GIF」
  // 下載到跟畫面上不同的那一份
  gifId: z.string().min(1).optional(),
});

/** 網頁圖片可用的格式。GIF 原檔也是 IMAGE，但它未經壓縮，不該上前台 */
const WEB_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);

type Context = { params: Promise<{ resource: string; id: string }> };

export async function PUT(request: Request, context: Context) {
  const denied = verifyApiKey(request);
  if (denied) {
    return NextResponse.json({ error: denied.error }, { status: denied.status });
  }

  const { resource, id } = await context.params;
  if (!isResource(resource)) {
    return NextResponse.json(
      { error: `未知的資源，可用：${resourceList.join("、")}` },
      { status: 404 },
    );
  }
  if (resource === "faq") {
    return NextResponse.json(
      { error: "常見問題沒有圖片可以更換" },
      { status: 405 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "請求主體不是有效的 JSON" },
      { status: 400 },
    );
  }

  const result =
    resource === "frames"
      ? await replaceFrame(id, body)
      : await replaceImage(resource, id, body);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  revalidateContent(definitionOf(resource).section);
  return NextResponse.json(result.body);
}

type Outcome =
  | { body: Record<string, unknown> }
  | { error: string; status: number };

type ImageAsset = {
  id: string;
  mimeType: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
};

/** 確認 asset 存在且是網頁可用的圖片 */
async function webImage(
  assetId: string,
): Promise<{ asset: ImageAsset } | { error: string; status: number }> {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
    select: { id: true, mimeType: true, intrinsicWidth: true, intrinsicHeight: true },
  });
  if (!asset) return { error: "找不到這個檔案，請確認 assetId", status: 404 };
  if (!WEB_IMAGE.has(asset.mimeType)) {
    return { error: `這個檔案是 ${asset.mimeType}，這裡只能用 JPG、PNG 或 WebP`, status: 422 };
  }
  return { asset };
}

async function replaceImage(
  resource: Exclude<Resource, "faq" | "frames">,
  id: string,
  body: unknown,
): Promise<Outcome> {
  const parsed = singleSchema.safeParse(body);
  if (!parsed.success) return { error: "請提供 assetId", status: 422 };

  const checked = await webImage(parsed.data.assetId);
  if ("error" in checked) return checked;
  const { asset } = checked;

  switch (resource) {
    case "hero": {
      const slide = await prisma.heroSlide.findUnique({
        where: { id },
        select: { assetId: true },
      });
      if (!slide) return { error: "找不到這筆項目", status: 404 };
      if (slide.assetId === asset.id) {
        return { error: "新舊是同一張圖", status: 422 };
      }

      // 三排共用同一組相框：換掉這張，另外兩排的同一張也要一起換，
      // 否則圖庫會多出一張只有某一排才有的相框
      const taken = await prisma.heroSlide.count({ where: { assetId: asset.id } });
      if (taken > 0) {
        return { error: "這張圖已經在主視覺裡了，同一張不能出現兩次", status: 409 };
      }

      const { count } = await prisma.heroSlide.updateMany({
        where: { assetId: slide.assetId },
        data: { assetId: asset.id },
      });
      // 版面尺寸不動：主視覺一律 275×410，不跟著新檔案的比例走
      const slides = await prisma.heroSlide.findMany({
        where: { assetId: asset.id },
        orderBy: { track: "asc" },
      });
      return { body: { replaced: count, items: slides.map(serialise) } };
    }

    case "events": {
      const photo = await prisma.eventPhoto.findUnique({
        where: { id },
        select: { displayHeight: true },
      });
      if (!photo) return { error: "找不到這筆項目", status: 404 };

      // 現場照高度統一、寬度照比例，與後台新增時的算法相同。
      // 沿用舊寬度的話，比例不同的新照片會被拉伸
      const displayWidth = Math.round(
        (asset.intrinsicWidth / asset.intrinsicHeight) * photo.displayHeight,
      );
      const updated = await prisma.eventPhoto.update({
        where: { id },
        data: { assetId: asset.id, displayWidth },
      });
      return { body: { item: serialise(updated) } };
    }

    case "cases": {
      const exists = await prisma.caseItem.count({ where: { id } });
      if (!exists) return { error: "找不到這筆項目", status: 404 };
      const updated = await prisma.caseItem.update({
        where: { id },
        data: { assetId: asset.id },
      });
      return { body: { item: serialise(updated) } };
    }

    case "categories": {
      const exists = await prisma.caseCategory.count({ where: { id } });
      if (!exists) return { error: "找不到這筆項目", status: 404 };
      const updated = await prisma.caseCategory.update({
        where: { id },
        data: { coverId: asset.id },
      });
      return { body: { item: serialise(updated) } };
    }
  }
}

async function replaceFrame(id: string, body: unknown): Promise<Outcome> {
  const parsed = frameSchema.safeParse(body);
  if (!parsed.success) {
    return { error: "請提供 posterId、webmId 與 mp4Id", status: 422 };
  }

  const exists = await prisma.frameAnimation.count({ where: { id } });
  if (!exists) return { error: "找不到這筆項目", status: 404 };

  // 逐一確認檔案種類，避免把封面圖填進影片欄位 —— 那樣網站上會是一格
  // 播不出來的空白，而且不會有任何錯誤訊息
  const { posterId, webmId, mp4Id, gifId } = parsed.data;
  const expected: [string, string, string][] = [
    ["posterId", posterId, "image/jpeg"],
    ["webmId", webmId, "video/webm"],
    ["mp4Id", mp4Id, "video/mp4"],
  ];
  if (gifId) expected.push(["gifId", gifId, "image/gif"]);

  const assets = await prisma.mediaAsset.findMany({
    where: { id: { in: expected.map(([, assetId]) => assetId) } },
    select: { id: true, mimeType: true },
  });
  const typeOf = new Map(assets.map((a) => [a.id, a.mimeType]));

  for (const [field, assetId, mime] of expected) {
    const actual = typeOf.get(assetId);
    if (!actual) return { error: `${field} 找不到對應的檔案`, status: 404 };
    if (actual !== mime) {
      return { error: `${field} 應為 ${mime}，實際是 ${actual}`, status: 422 };
    }
  }

  // 顯示尺寸與傾斜角不動，與後台的「上傳 GIF 更換動畫」一致
  const updated = await prisma.frameAnimation.update({
    where: { id },
    data: { posterId, webmId, mp4Id, gifId: gifId ?? null },
  });
  return { body: { item: serialise(updated) } };
}
