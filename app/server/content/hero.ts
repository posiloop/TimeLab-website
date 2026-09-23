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
