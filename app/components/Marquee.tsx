import Image from "next/image";

export type MarqueeItem = {
  src: string;
  width: number;
  height: number;
  /** 有意義的圖片可給描述；省略則視為裝飾性圖片 */
  alt?: string;
  /** 個別圖片的傾斜角（度），用於設計稿中各自微傾的排版 */
  rotate?: number;
  /** 旋轉後佔用的水平寬度（px）。CSS rotate 不影響版面，需明確保留空間 */
  boxWidth?: number;
  /** 旋轉後佔用的垂直高度（px）。未保留會使上下角被容器裁掉 */
  boxHeight?: number;
};

type MarqueeProps = {
  items: MarqueeItem[];
  /** 捲動方向，預設向左 */
  direction?: "left" | "right";
  /** 一輪捲完所需秒數 */
  duration?: number;
  /** 圖片顯示高度（px） */
  height: number;
  /** 圖片是否保留圓角，預設保留 */
  rounded?: boolean;
  /** 圖片間距（px），預設 40 */
  gap?: number;
  /** 首屏跑馬燈設為 true，讓第一份圖片立即載入 */
  priority?: boolean;
  /** GIF 需設為 true，否則會被最佳化成靜態圖而失去動畫 */
  unoptimized?: boolean;
  className?: string;
};

export default function Marquee({
  items,
  direction = "left",
  duration = 60,
  height,
  rounded = true,
  gap = 40,
  priority = false,
  unoptimized = false,
  className = "",
}: MarqueeProps) {
  // 重複兩份才能無縫銜接：位移 -50% 時第二份剛好接上第一份的起點
  const loop = [...items, ...items];

  return (
    <div className={`overflow-hidden ${className}`}>
      <ul
        className="marquee-track flex w-max items-center"
        style={{
          gap,
          paddingInline: gap / 2,
          animation: `marquee-${direction} ${duration}s linear infinite`,
        }}
      >
        {loop.map((item, index) => (
          // 對應設計稿的三層結構：外層 li 保留旋轉後的佔位寬度，
          // 中層負責旋轉，內層是固定尺寸的圖框（圖片以 contain 置中，不裁切）
          <li
            key={`${item.src}-${index}`}
            className={`shrink-0${item.boxWidth ? " flex items-center justify-center" : ""}`}
            style={{
              ...(item.boxWidth ? { width: item.boxWidth } : {}),
              ...(item.boxHeight ? { height: item.boxHeight } : {}),
            }}
          >
            <div
              className="flex-none"
              style={item.rotate ? { rotate: `${item.rotate}deg` } : undefined}
            >
              <Image
                src={item.src}
                alt={index < items.length ? (item.alt ?? "") : ""}
                width={item.width}
                height={item.height}
                // 第二份為視覺重複，對輔助技術隱藏
                aria-hidden={index >= items.length}
                // 跑馬燈的第二份是無縫銜接所需、捲動時必定露出，
                // 故一律 eager；圖檔已壓縮，不致搶佔過多連線
                priority={priority && index < items.length}
                loading="eager"
                unoptimized={unoptimized}
                className={`${rounded ? "rounded-[10px] " : ""}object-contain`}
                style={
                  item.boxWidth
                    ? { width: item.width, height: item.height }
                    : { height, width: "auto" }
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
