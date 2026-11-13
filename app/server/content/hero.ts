import { unstable_cache } from "next/cache";
import type { MarqueeItem } from "@/app/components/Marquee";
import type { TrackKey } from "@/app/generated/prisma/enums";
import { prisma } from "../db";
import { mediaUrl } from "../s3";
import { TAGS } from "./tags";

export type HeroTracks = Record<TrackKey, MarqueeItem[]>;

/**
 * 三軌一次查完再分組。分三次查不只多兩趟往返，更重要的是三軌必須來自
 * 同一個快照 —— 否則後台正在重排時，畫面可能出現軌 1 是新順序、
 * 軌 3 還是舊順序。
 */
async function loadHeroTracks(): Promise<HeroTracks> {
  const slides = await prisma.heroSlide.findMany({
    where: { isVisible: true, asset: { deletedAt: null } },
    orderBy: [{ track: "asc" }, { position: "asc" }],
    select: {
      track: true,
      alt: true,
      displayWidth: true,
      displayHeight: true,
      asset: { select: { key: true } },
    },
  });

  const tracks: HeroTracks = { TRACK_1: [], TRACK_2: [], TRACK_3: [] };

  for (const slide of slides) {
    tracks[slide.track].push({
      src: mediaUrl(slide.asset.key),
      // 版面尺寸取自 HeroSlide 而非檔案真實像素：12 張原檔實際有三種尺寸，
      // 跟著檔案走會讓相框寬度出現次像素差，間距與跑馬燈接點都會歪
      width: slide.displayWidth,
      height: slide.displayHeight,
      ...(slide.alt ? { alt: slide.alt } : {}),
    });
  }

  return tracks;
}

export const getHeroTracks = unstable_cache(
  loadHeroTracks,
  // keyParts 明確給值，不倚賴 Next 以函式原始碼推導的預設 key。
  // 尾端的 v1 在回傳形狀改變時升版，讓舊 entry 自然失效 —— 否則部署後
  // 可能讀到帶著舊形狀的快取，畫面會因為少一個欄位而炸掉
  ["content", "hero", "tracks", "v1"],
  // 永久快取直到明確失效：內容可能一天改一次，也可能三個月不動，
  // 用時間輪詢只會讓絕大多數請求白跑資料庫
  { tags: [TAGS.hero], revalidate: false },
);

/**
 * 首頁左側介紹區（紅框那塊）。預設關閉時 image 為 null，About 會退回
 * 寫死的 logo＋文字。只有在 imageMode 開啟、且有一張未被軟刪除的圖時，
 * 才回傳 image 讓畫面整塊換成那張圖。
 *
 * width／height 取自檔案真實像素供 next/image 算比例；跨 RSC 邊界只帶純量。
 */
export type HeroIntroView = {
  imageMode: boolean;
  image: { src: string; alt: string; width: number; height: number } | null;
};

async function loadHeroIntro(): Promise<HeroIntroView> {
  // singleton：正常只有一列，用 findFirst 不綁定 id，連還沒建立時也安全
  const intro = await prisma.heroIntro.findFirst({
    select: {
      imageMode: true,
      alt: true,
      asset: {
        select: {
          key: true,
          intrinsicWidth: true,
          intrinsicHeight: true,
          deletedAt: true,
        },
      },
    },
  });

  const usable =
    intro?.imageMode && intro.asset && intro.asset.deletedAt === null
      ? intro.asset
      : null;

  return {
    imageMode: Boolean(intro?.imageMode),
    image: usable
      ? {
          src: mediaUrl(usable.key),
          alt: intro?.alt?.trim() || "時光研究室 TiMELAB",
          width: usable.intrinsicWidth,
          height: usable.intrinsicHeight,
        }
      : null,
  };
}

export const getHeroIntro = unstable_cache(
  loadHeroIntro,
  ["content", "hero", "intro", "v1"],
  // 與三軌共用 content:hero 標籤：左側介紹區與三排相框同屬首頁主視覺，
  // 一起失效不會多 render 任何東西，也少一個「改了卻忘記失效」的出錯面
  { tags: [TAGS.hero], revalidate: false },
);
