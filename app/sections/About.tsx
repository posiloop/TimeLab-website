import Image from "next/image";
import Marquee from "../components/Marquee";
import { getHeroTracks } from "../server/content/hero";

export default async function About() {
  const tracks = await getHeroTracks();

  return (
    <section id="about" className="flex items-end max-lg:flex-col-reverse">
      <div className="flex h-[540px] flex-1 flex-col items-center justify-center gap-8 py-[120px] pl-[122px] pr-16 max-xl:pl-16 max-lg:h-[196px] max-lg:w-full max-lg:flex-none max-lg:flex-row max-lg:justify-center max-lg:gap-10 max-lg:px-6 max-lg:py-0 max-md:h-auto max-md:flex-col max-md:justify-center max-md:gap-8 max-md:px-6 max-md:py-14">
        <Image
          src="/images/brand/logo.png"
          alt="時光研究室 TiMELAB"
          width={320}
          height={214}
          priority
          className="h-[214px] w-[320px] object-contain max-xl:h-[154px] max-xl:w-[230px] max-md:h-[131px] max-md:w-[196px]"
        />
        <div className="flex w-full flex-col items-center justify-center gap-6 text-center max-md:gap-4">
          <h1 className="text-h1 text-black">時光研究室</h1>
          {/* 設計稿在 Mobile 斷成兩行，窄螢幕才讓瀏覽器自行折行 */}
          <p className="text-h2 text-black/55">
            全台指標韓式拍貼品牌
            <span className="max-md:block">【千場實績，定義拍貼新標準】</span>
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
            items={tracks.TRACK_1}
            height={410}
            gap={16}
            duration={40}
            direction="right"
            rounded={false}
            priority
          />
          <Marquee
            items={tracks.TRACK_2}
            height={410}
            gap={16}
            duration={40}
            rounded={false}
            priority
          />
          <Marquee
            items={tracks.TRACK_3}
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
