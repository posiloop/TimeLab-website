import Image from "next/image";

export type MarqueeItem = {
  src: string;
  width: number;
  height: number;
};

type MarqueeProps = {
  items: MarqueeItem[];
  /** 捲動方向，預設向左 */
  direction?: "left" | "right";
  /** 一輪捲完所需秒數 */
  duration?: number;
  /** 圖片顯示高度（px） */
  height: number;
  className?: string;
};

export default function Marquee({
  items,
  direction = "left",
  duration = 60,
  height,
  className = "",
}: MarqueeProps) {
  // 重複兩份才能無縫銜接：位移 -50% 時第二份剛好接上第一份的起點
  const loop = [...items, ...items];

  return (
    <div className={`overflow-hidden ${className}`}>
      <ul
        className="marquee-track flex w-max items-center gap-10 px-5"
        style={{
          animation: `marquee-${direction} ${duration}s linear infinite`,
        }}
      >
        {loop.map((item, index) => (
          <li key={`${item.src}-${index}`} className="shrink-0">
            <Image
              src={item.src}
              alt=""
              width={item.width}
              height={item.height}
              // 第二份為視覺重複，對輔助技術隱藏
              aria-hidden={index >= items.length}
              className="rounded-[10px] object-cover"
              style={{ height, width: "auto" }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
