import Image from "next/image";

const FRAME_GIFS = [
  { src: "/images/gif/frame-4grid.gif", alt: "標準四格拍貼框", width: 280 },
  { src: "/images/gif/frame-american.gif", alt: "美式俯拍拍貼框", width: 267 },
  { src: "/images/gif/frame-6grid.gif", alt: "標準六格拍貼框", width: 283 },
  { src: "/images/gif/frame-pink.gif", alt: "粉色俯拍拍貼框", width: 267 },
  { src: "/images/gif/frame-8grid.gif", alt: "標準八格拍貼框", width: 294 },
];

export default function About() {
  return (
    // 設計稿 padding-top 150px 已含頁首高度，此處扣除 main 的 pt-[100px]
    <section id="about" className="pt-[50px] max-md:pt-[30px]">
      <div className="flex flex-col items-center px-4">
        <Image
          src="/images/brand/logo.png"
          alt="時光研究室 TiMELAB"
          width={236}
          height={179}
          priority
          className="h-[179px] w-[236px] object-contain max-md:h-[120px] max-md:w-[158px]"
        />
        <h1 className="glow mt-6 text-center text-hero tracking-[0.2em] text-brand-ink max-lg:text-[64px] max-md:text-[40px]">
          時光研究室
        </h1>
        <p className="mt-4 max-w-[1258px] text-center text-lead tracking-[0.08em] text-brand-ink max-lg:text-[32px] max-md:text-[22px]">
          全台指標韓式拍貼品牌【千場實績，定義拍貼新標準】
        </p>
        <p className="mt-5 text-center text-2xl tracking-[0.46em] text-brand-ink max-lg:text-lg max-md:text-sm max-md:tracking-[0.2em]">
          從數十人的聚會到數萬人的大型活動，每一次快門，都留下燦爛瞬間。
        </p>
      </div>

      <ul className="mt-10 flex items-center justify-center gap-[31px] px-4 max-lg:flex-wrap max-lg:gap-5">
        {FRAME_GIFS.map((gif) => (
          <li key={gif.src}>
            <Image
              src={gif.src}
              alt={gif.alt}
              width={gif.width}
              height={Math.round((gif.width * 1073) / 720)}
              unoptimized
              // 首屏 GIF，避免延遲載入拖累 LCP
              priority
              className="h-auto rounded-[10px] object-contain max-lg:w-[200px] max-md:w-[140px]"
              style={{ width: gif.width }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
