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

/** 活動現場照的原圖寬度（高一律 760）—— 直式、橫式與超寬三種比例混用，
    需逐張給值，next/image 的寬高比才會與檔案相符 */
const EVENT_WIDTHS: Record<string, Record<string, number>> = {
  e1: { "01": 1013, "02": 570, "03": 1013, "04": 570, "05": 1013, "06": 570, "07": 1013 },
  e2: { "01": 1013, "02": 570, "03": 1140, "04": 570, "05": 1013, "06": 570, "07": 1013 },
  e3: { "01": 570, "02": 1013, "03": 570, "04": 1013, "05": 570, "06": 1013, "07": 1013 },
};

/** 活動現場照 —— 三軌，顯示高度由 Marquee 的 height 決定 */
const eventTrack = (prefix: string): MarqueeItem[] =>
  Array.from({ length: 7 }, (_, i) => {
    const no = String(i + 1).padStart(2, "0");
    return {
      src: `/images/event/${prefix}-${no}.jpg`,
      width: EVENT_WIDTHS[prefix][no],
      height: 760,
    };
  });

export const EVENT_TRACK_1 = eventTrack("e1");
export const EVENT_TRACK_2 = eventTrack("e2");
export const EVENT_TRACK_3 = eventTrack("e3");
