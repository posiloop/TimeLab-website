import Marquee, { type MarqueeItem } from "./components/Marquee";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import StructuredData from "./components/StructuredData";
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

/** 拍貼框動畫 —— 設計稿 Images 區塊 (1:3602)。
    width/height 為設計稿的圖框尺寸，影片以 contain 置中不裁切；
    boxWidth/boxHeight 是旋轉後的佔位尺寸（取自設計稿外框），
    未保留足夠空間會讓影片的四角被裁掉。
    原始素材為 GIF，共 30MB；改以 WebM/MP4 播放後降至 0.75MB，
    src 指向第一幀，於自動播放被系統擋下時作為靜態底圖 */
const FRAME_VIDEOS: MarqueeItem[] = [
  { src: "/videos/frame-4grid-poster.jpg", video: { webm: "/videos/frame-4grid.webm", mp4: "/videos/frame-4grid.mp4" }, alt: "標準四格拍貼框", width: 305, height: 410, rotate: -2, boxWidth: 320, boxHeight: 421 },
  { src: "/videos/frame-american-poster.jpg", video: { webm: "/videos/frame-american.webm", mp4: "/videos/frame-american.mp4" }, alt: "美式俯拍拍貼框", width: 305, height: 410, rotate: 1, boxWidth: 313, boxHeight: 416 },
  { src: "/videos/frame-6grid-poster.jpg", video: { webm: "/videos/frame-6grid.webm", mp4: "/videos/frame-6grid.mp4" }, alt: "標準六格拍貼框", width: 309, height: 410, rotate: -5, boxWidth: 344, boxHeight: 436 },
  { src: "/videos/frame-pink-poster.jpg", video: { webm: "/videos/frame-pink.webm", mp4: "/videos/frame-pink.mp4" }, alt: "粉色俯拍拍貼框", width: 305, height: 410, boxWidth: 305, boxHeight: 410 },
  { src: "/videos/frame-8grid-poster.jpg", video: { webm: "/videos/frame-8grid.webm", mp4: "/videos/frame-8grid.mp4" }, alt: "標準八格拍貼框", width: 305, height: 410, rotate: 3, boxWidth: 326, boxHeight: 426 },
];

export default function Home() {
  return (
    <>
      <StructuredData />
      <SiteHeader />

      <main id="top" className="pt-(--header-h)">
        <About />
        <Stores />

        {/* 拍貼框動畫緩慢向左捲動；速度較其他跑馬燈慢，避免搶走視覺焦點 */}
        <Marquee
          items={FRAME_VIDEOS}
          height={410}
          gap={16}
          duration={45}
          rounded={false}
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
