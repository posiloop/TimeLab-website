import Marquee from "./components/Marquee";
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
import Machines from "./sections/Machines";
import Partnership from "./sections/Partnership";
import Plans from "./sections/Plans";
import RentalProcess from "./sections/RentalProcess";
import Stores from "./sections/Stores";

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="bg-timeline pt-(--header-h)">
        <About />
        <Stores />

        <Marquee items={FRAME_WORKS} height={358} duration={70} />

        <Machines />

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
