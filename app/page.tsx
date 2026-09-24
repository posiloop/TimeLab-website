import Marquee from "./components/Marquee";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import StructuredData from "./components/StructuredData";
import { getEventTracks } from "./server/content/events";
import { getFrameAnimations } from "./server/content/frames";
import About from "./sections/About";
import Cases from "./sections/Cases";
import Contact from "./sections/Contact";
import Faq from "./sections/Faq";
import Machines from "./sections/Machines";
import Partnership from "./sections/Partnership";
import Plans from "./sections/Plans";
import RentalProcess from "./sections/RentalProcess";
import Stores from "./sections/Stores";

export default async function Home() {
  // 兩者互不相依，一起取省一趟往返
  const [frames, events] = await Promise.all([
    getFrameAnimations(),
    getEventTracks(),
  ]);

  return (
    <>
      <StructuredData />
      <SiteHeader />

      <main id="top" className="pt-(--header-h)">
        <About />
        <Stores />

        {/* 拍貼框動畫緩慢向左捲動；速度較其他跑馬燈慢，避免搶走視覺焦點 */}
        <Marquee
          items={frames}
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
          <Marquee items={events.TRACK_1} height={380} duration={45} rounded={false} />
          <Marquee items={events.TRACK_3} height={380} duration={45} direction="right" rounded={false} />
          <Marquee items={events.TRACK_2} height={380} duration={45} rounded={false} />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
