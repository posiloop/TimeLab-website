import Image from "next/image";

export type MarqueeItem = {
  src: string;
  width: number;
  height: number;
  /** 指定後改以 <video> 播放；src 作為自動播放被擋時的靜態底圖。
      原為 GIF 的項目改用此欄位，檔案小兩個數量級 */
  video?: { webm: string; mp4: string };
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
  /** 首屏跑馬燈設為 true，讓一開始就露出的那幾張優先載入 */
  priority?: boolean;
  /** priority 為 true 時實際預載的張數。整軌都預載會讓數十張圖同時搶頻寬，
      反而拖慢 LCP；預設 6 張，約可蓋滿 1440px 寬的首屏 */
  priorityCount?: number;
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
  priorityCount = 6,
  unoptimized = false,
  className = "",
}: MarqueeProps) {
  // 重複兩份才能無縫銜接：位移 -50% 時第二份剛好接上第一份的起點
  const loop = [...items, ...items];

  // 向左捲從 translateX(0) 起步，首屏看到的是第一份的開頭；
  // 向右捲從 translateX(-50%) 起步，看到的是第二份的開頭。
  // 判斷錯邊會讓真正在畫面上的圖被設成 lazy，拖慢 LCP
  const firstVisible = direction === "right" ? items.length : 0;
  const isVisible = (index: number) =>
    index >= firstVisible && index < firstVisible + priorityCount;

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
              {item.video ? (
                // <video> 的預設 object-fit 是 fill，須明確指定 contain 才與圖片一致
                <video
                  width={item.width}
                  height={item.height}
                  poster={item.src}
                  autoPlay
                  muted
                  loop
                  // 缺少 playsInline 會讓 iOS Safari 強制全螢幕播放
                  playsInline
                  aria-hidden
                  className={`${rounded ? "rounded-[10px] " : ""}object-contain`}
                  style={
                    item.boxWidth
                      ? { width: item.width, height: item.height }
                      : { height, width: "auto" }
                  }
                >
                  <source src={item.video.webm} type="video/webm" />
                  <source src={item.video.mp4} type="video/mp4" />
                </video>
              ) : (
                <Image
                  src={item.src}
                  alt={index < items.length ? (item.alt ?? "") : ""}
                  width={item.width}
                  height={item.height}
                  // 第二份為視覺重複，對輔助技術隱藏
                  aria-hidden={index >= items.length}
                  priority={priority && isVisible(index)}
                  // 畫面外的那一份要捲過一輪後才露出，設為 eager 會與首屏圖片
                  // 搶頻寬，實測會把 LCP 從 5.3s 拖到 10.9s
                  loading={isVisible(index) ? "eager" : "lazy"}
                  unoptimized={unoptimized}
                  className={`${rounded ? "rounded-[10px] " : ""}object-contain`}
                  style={
                    item.boxWidth
                      ? { width: item.width, height: item.height }
                      : { height, width: "auto" }
                  }
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
