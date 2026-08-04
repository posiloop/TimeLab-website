import Marquee from "./components/Marquee";
import SectionTitle from "./components/SectionTitle";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import {
  EVENT_TRACK_1,
  EVENT_TRACK_2,
  EVENT_TRACK_3,
  FRAME_WORKS,
} from "./data/gallery";
import About from "./sections/About";
import Cases from "./sections/Cases";
import Contact from "./sections/Contact";
import Partnership from "./sections/Partnership";
import Plans from "./sections/Plans";
import RentalProcess from "./sections/RentalProcess";
import Stores from "./sections/Stores";

/** 尚未取得設計稿細節的區塊，先以骨架佔位並保留錨點 */
function PendingSection({ id, title }: { id: string; title: string }) {
  return (
    <section
      id={id}
      className="flex flex-col items-center gap-[30px] px-4 pt-[150px] max-md:pt-20"
    >
      <SectionTitle>{title}</SectionTitle>
      <div className="flex h-[380px] w-full max-w-[1514px] items-center justify-center rounded-[20px] bg-brand-mist/60 text-h2 text-brand max-md:h-[240px]">
        內容待補（等待設計稿截圖）
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="bg-timeline pt-[100px]">
        <About />
        <Stores />

        <Marquee items={FRAME_WORKS} height={358} duration={70} />

        <PendingSection id="machines" title="機台介紹" />

        <Cases />

        <RentalProcess />
        <Plans />
        <Partnership />

        <div className="flex flex-col gap-5 pt-[150px] max-md:pt-20">
          <Marquee items={EVENT_TRACK_1} height={380} duration={80} />
          <Marquee
            items={EVENT_TRACK_3}
            height={380}
            duration={80}
            direction="right"
          />
          <Marquee items={EVENT_TRACK_2} height={380} duration={80} />
        </div>

        <Contact />
      </main>

      <SiteFooter />
    </>
  );
}
