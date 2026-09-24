import { unstable_cache } from "next/cache";
import type { MarqueeItem } from "@/app/components/Marquee";
import { prisma } from "../db";
import { mediaUrl } from "../s3";
import { TAGS } from "./tags";

/**
 * 拍貼框動畫。回傳形狀直接對應 Marquee 的 MarqueeItem：src 是 poster
 * （自動播放被擋時的靜態底圖），video 帶 webm 與 mp4 兩個來源。
 */
async function loadFrameAnimations(): Promise<MarqueeItem[]> {
  const frames = await prisma.frameAnimation.findMany({
    where: { isVisible: true },
    orderBy: { position: "asc" },
    select: {
      alt: true,
      displayWidth: true,
      displayHeight: true,
      rotate: true,
      boxWidth: true,
      boxHeight: true,
      poster: { select: { key: true } },
      webm: { select: { key: true } },
      mp4: { select: { key: true } },
    },
  });

  return frames.map((frame) => ({
    src: mediaUrl(frame.poster.key),
    video: {
      webm: mediaUrl(frame.webm.key),
      mp4: mediaUrl(frame.mp4.key),
    },
    alt: frame.alt,
    // 圖框尺寸，非 poster 的真實像素（原檔 610x910，版面用 305x410）
    width: frame.displayWidth,
    height: frame.displayHeight,
    // rotate 為 0 時不傳，讓 Marquee 省去多餘的 style
    ...(frame.rotate !== 0 ? { rotate: frame.rotate } : {}),
    boxWidth: frame.boxWidth,
    boxHeight: frame.boxHeight,
  }));
}

export const getFrameAnimations = unstable_cache(
  loadFrameAnimations,
  ["content", "frames", "v1"],
  { tags: [TAGS.frames], revalidate: false },
);
