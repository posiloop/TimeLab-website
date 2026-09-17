import Image from "next/image";
import Marquee from "../components/Marquee";
import { HERO_TRACK_1, HERO_TRACK_2, HERO_TRACK_3 } from "../data/gallery";

export default function About() {
  return (
    <section id="about" className="flex items-end max-lg:flex-col-reverse">
      <div className="flex h-[540px] flex-1 flex-col items-center justify-center gap-8 py-[120px] pl-[122px] pr-16 max-xl:pl-16 max-lg:h-[196px] max-lg:w-full max-lg:flex-none max-lg:flex-row max-lg:justify-center max-lg:gap-10 max-lg:px-6 max-lg:py-0 max-md:h-[387px] max-md:flex-col max-md:justify-center max-md:gap-6 max-md:py-0">
        <Image
          src="/images/brand/logo.png"
          alt="時光研究室 TiMELAB"
          width={320}
          height={214}
          priority
          className="h-[214px] w-[320px] object-contain max-xl:h-[154px] max-xl:w-[230px] max-md:h-[120px] max-md:w-[180px]"
        />
        <div className="flex w-full flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-h1 text-black max-md:text-2xl">時光研究室</h1>
          <p className="text-h2 text-black/55 max-md:text-base">
            全台指標韓式拍貼品牌【千場實績，定義拍貼新標準】
          </p>
        </div>
      </div>

      {/* 三排相框以 −6° 傾斜交錯捲動，overflow 裁掉溢出的部分 */}
      <div
        aria-hidden
        className="flex h-[540px] w-full min-w-0 flex-1 flex-col items-center justify-center overflow-hidden max-lg:h-[499px] max-lg:flex-none max-md:h-[375px]"
      >
        {/* 傾斜後四角會露出容器，故整組放大並置中溢出。
            軌之間與軌內圖片皆留 16px，對應設計稿每張相框四周的白邊 */}
        <div className="flex w-[1440px] shrink-0 -rotate-6 flex-col gap-4">
          <Marquee
            items={HERO_TRACK_1}
            height={410}
            gap={16}
            duration={40}
            direction="right"
            rounded={false}
            priority
          />
          <Marquee
            items={HERO_TRACK_2}
            height={410}
            gap={16}
            duration={40}
            rounded={false}
            priority
          />
          <Marquee
            items={HERO_TRACK_3}
            height={410}
            gap={16}
            duration={40}
            direction="right"
            rounded={false}
            priority
          />
        </div>
      </div>
    </section>
  );
}
