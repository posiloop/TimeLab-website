import { prisma } from "@/app/server/db";
import { STEP } from "@/app/server/content/reorder";
import { INCLUDE, present } from "./handler";

/**
 * 主視覺的新增、修改與刪除一律三排一起。
 *
 * 三排共用同一組相框、各自排序 —— 後台新增時一次加進三排，刪除時三排
 * 一起刪，換圖端點也是三排一起換。API 若讓呼叫方一排一排處理，中途失敗
 * 或少做一次，就會留下只有某一排才有的相框，而這種不一致在網站上不容易
 * 看出來。所以這裡把「一張相框」當成操作單位，並包在交易裡：三排要嘛
 * 全部成功，要嘛全部不動。
 */

const TRACKS = ["TRACK_1", "TRACK_2", "TRACK_3"] as const;

type Outcome =
  | { status: number; body: Record<string, unknown> }
  | { status: number; error: string };

/** 同一張相框在三排的三筆，依排序 */
function siblingsOf(assetId: string) {
  return prisma.heroSlide.findMany({
    where: { assetId },
    orderBy: { track: "asc" },
    include: INCLUDE.hero,
  });
}

export async function createHero(input: {
  assetId: string;
  alt?: string;
  isVisible: boolean;
}): Promise<Outcome> {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: input.assetId },
    select: { mimeType: true },
  });
  if (!asset) {
    return { status: 409, error: "關聯的項目不存在 —— 請確認 assetId 是有效的 ID" };
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(asset.mimeType)) {
    return { status: 422, error: `這個檔案是 ${asset.mimeType}，主視覺只能用 JPG、PNG 或 WebP` };
  }

  // 同一個檔案重複上傳會去重成同一個 asset，不擋的話同一張相框會在
  // 每一排出現兩次
  const taken = await prisma.heroSlide.count({ where: { assetId: input.assetId } });
  if (taken > 0) {
    return { status: 409, error: "這張圖已經在主視覺裡了，同一張不能出現兩次" };
  }

  await prisma.$transaction(async (tx) => {
    for (const track of TRACKS) {
      // 版面尺寸沿用該排最後一張，與後台 addHeroSlide 一致 —— 不跟著新檔案
      // 的比例走，否則相框寬度會出現次像素差
      const last = await tx.heroSlide.findFirst({
        where: { track },
        orderBy: { position: "desc" },
        select: { position: true, displayWidth: true, displayHeight: true },
      });
      await tx.heroSlide.create({
        data: {
          track,
          assetId: input.assetId,
          alt: input.alt,
          isVisible: input.isVisible,
          position: (last?.position ?? 0) + STEP,
          displayWidth: last?.displayWidth ?? 275,
          displayHeight: last?.displayHeight ?? 410,
        },
      });
    }
  });

  const items = await siblingsOf(input.assetId);
  return { status: 201, body: { items: items.map((row) => present("hero", row)) } };
}

export async function updateHero(
  id: string,
  data: Record<string, unknown>,
): Promise<Outcome> {
  const slide = await prisma.heroSlide.findUnique({
    where: { id },
    select: { assetId: true },
  });
  if (!slide) return { status: 404, error: "找不到這筆項目" };

  // 隱藏或改尺寸只動一排的話，三排看起來就不再是同一組相框
  const { count } = await prisma.heroSlide.updateMany({
    where: { assetId: slide.assetId },
    data,
  });

  const items = await siblingsOf(slide.assetId);
  return {
    status: 200,
    body: { updated: count, items: items.map((row) => present("hero", row)) },
  };
}

export async function deleteHero(id: string): Promise<Outcome> {
  const slide = await prisma.heroSlide.findUnique({
    where: { id },
    select: { assetId: true },
  });
  if (!slide) return { status: 404, error: "找不到這筆項目" };

  const siblings = await prisma.heroSlide.findMany({
    where: { assetId: slide.assetId },
    select: { id: true },
  });
  await prisma.heroSlide.deleteMany({ where: { assetId: slide.assetId } });

  return { status: 200, body: { deleted: siblings.map((row) => row.id) } };
}
