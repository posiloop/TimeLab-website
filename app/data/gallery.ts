import type { MarqueeItem } from "../components/Marquee";

const roll = (n: number): MarqueeItem => ({
  src: `/images/roll/roll-${String(n).padStart(2, "0")}.png`,
  width: 275,
  height: 410,
});

/** 主視覺三軌 —— 同一組相框依設計稿各自的排序輪播，避免三排同步 */
export const HERO_TRACK_1 = [7, 8, 9, 10, 11, 12, 1, 5, 2, 6, 3, 4].map(roll);
export const HERO_TRACK_2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(roll);
export const HERO_TRACK_3 = [7, 8, 3, 9, 1, 10, 6, 2, 4, 11, 5, 12].map(roll);

/** 拍貼框作品 —— 設計稿「拍貼框滾動條」，直式約 240x358 */
export const FRAME_WORKS: MarqueeItem[] = Array.from({ length: 12 }, (_, i) => ({
  src: `/images/roll/roll-${String(i + 1).padStart(2, "0")}.png`,
  width: 240,
  height: 358,
}));

/** 活動現場照 —— 三軌，設計稿高度統一 380（原圖已縮至 760px 高並轉 JPEG） */
const eventTrack = (prefix: string): MarqueeItem[] =>
  Array.from({ length: 7 }, (_, i) => ({
    src: `/images/event/${prefix}-${String(i + 1).padStart(2, "0")}.jpg`,
    width: 507,
    height: 380,
  }));

export const EVENT_TRACK_1 = eventTrack("e1");
export const EVENT_TRACK_2 = eventTrack("e2");
export const EVENT_TRACK_3 = eventTrack("e3");
