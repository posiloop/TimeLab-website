import type { MarqueeItem } from "../components/Marquee";

/** 拍貼框作品 —— 設計稿「拍貼框滾動條」，直式約 240x358 */
export const FRAME_WORKS: MarqueeItem[] = Array.from({ length: 12 }, (_, i) => ({
  src: `/images/roll/roll-${String(i + 1).padStart(2, "0")}.png`,
  width: 240,
  height: 358,
}));

/** 活動現場照 —— 三軌，設計稿高度統一 380 */
const eventTrack = (prefix: string): MarqueeItem[] =>
  Array.from({ length: 7 }, (_, i) => ({
    src: `/images/event/${prefix}-${String(i + 1).padStart(2, "0")}.png`,
    width: 507,
    height: 380,
  }));

export const EVENT_TRACK_1 = eventTrack("e1");
export const EVENT_TRACK_2 = eventTrack("e2");
export const EVENT_TRACK_3 = eventTrack("e3");
