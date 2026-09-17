import Marquee, { type MarqueeItem } from "./components/Marquee";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import {
  EVENT_TRACK_1,
  EVENT_TRACK_2,
  EVENT_TRACK_3,
} from "./data/gallery";
import About from "./sections/About";
import Cases from "./sections/Cases";
import Contact from "./sections/Contact";
import Faq from "./sections/Faq";
import Machines from "./sections/Machines";
import Partnership from "./sections/Partnership";
import Plans from "./sections/Plans";
import RentalProcess from "./sections/RentalProcess";
import Stores from "./sections/Stores";

/** 拍貼框 GIF —— 設計稿 Images 區塊 (1:3602)。
    width/height 為設計稿的圖框尺寸，圖片以 contain 置中不裁切；
    boxWidth/boxHeight 是旋轉後的佔位尺寸（取自設計稿外框），
    未保留足夠空間會讓圖片的四角被裁掉 */
const FRAME_GIFS: MarqueeItem[] = [
  { src: "/images/gif/frame-4grid.gif", alt: "標準四格拍貼框", width: 305, height: 410, rotate: -2, boxWidth: 320, boxHeight: 421 },
  { src: "/images/gif/frame-american.gif", alt: "美式俯拍拍貼框", width: 305, height: 410, rotate: 1, boxWidth: 313, boxHeight: 416 },
  { src: "/images/gif/frame-6grid.gif", alt: "標準六格拍貼框", width: 309, height: 410, rotate: -5, boxWidth: 344, boxHeight: 436 },
  { src: "/images/gif/frame-pink.gif", alt: "粉色俯拍拍貼框", width: 305, height: 410, boxWidth: 305, boxHeight: 410 },
  { src: "/images/gif/frame-8grid.gif", alt: "標準八格拍貼框", width: 305, height: 410, rotate: 3, boxWidth: 326, boxHeight: 426 },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main id="top" className="pt-(--header-h)">
        <About />
        <Stores />

        {/* 拍貼框 GIF 緩慢向左捲動；速度較其他跑馬燈慢，避免搶走視覺焦點 */}
        <Marquee
          items={FRAME_GIFS}
          height={410}
          gap={16}
          duration={45}
          rounded={false}
          unoptimized
        />

        <Machines />
        <Cases />
        <RentalProcess />
        <Plans />
        <Partnership />
        <Faq />
        <Contact />

        {/* 活動現場照三軌，設計稿置於聯絡我們之後、頁尾之前 */}
        <div className="flex flex-col gap-5 py-10">
          <Marquee items={EVENT_TRACK_1} height={380} duration={45} rounded={false} />
          <Marquee items={EVENT_TRACK_3} height={380} duration={45} direction="right" rounded={false} />
          <Marquee items={EVENT_TRACK_2} height={380} duration={45} rounded={false} />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
