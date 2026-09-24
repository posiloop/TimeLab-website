import { prisma } from "@/app/server/db";
import { mediaUrl } from "@/app/server/s3";
import HeroEditor from "./HeroEditor";

export default async function HeroAdminPage() {
  const slides = await prisma.heroSlide.findMany({
    orderBy: [{ track: "asc" }, { position: "asc" }],
    select: {
      id: true,
      track: true,
      isVisible: true,
      displayWidth: true,
      displayHeight: true,
      asset: {
        select: {
          id: true,
          key: true,
          originalName: true,
          intrinsicWidth: true,
          intrinsicHeight: true,
        },
      },
    },
  });

  // 三軌共用同一組相框，圖庫取其去重後的集合
  const library = new Map<
    string,
    { id: string; url: string; name: string; width: number; height: number }
  >();
  for (const slide of slides) {
    if (!library.has(slide.asset.id)) {
      library.set(slide.asset.id, {
        id: slide.asset.id,
        url: mediaUrl(slide.asset.key),
        name: slide.asset.originalName ?? "未命名",
        width: slide.asset.intrinsicWidth,
        height: slide.asset.intrinsicHeight,
      });
    }
  }

  const tracks = {
    TRACK_1: slides.filter((s) => s.track === "TRACK_1"),
    TRACK_2: slides.filter((s) => s.track === "TRACK_2"),
    TRACK_3: slides.filter((s) => s.track === "TRACK_3"),
  };

  return (
    <HeroEditor
      library={[...library.values()]}
      tracks={{
        TRACK_1: tracks.TRACK_1.map(toView),
        TRACK_2: tracks.TRACK_2.map(toView),
        TRACK_3: tracks.TRACK_3.map(toView),
      }}
    />
  );
}

// props 會跨越 RSC 邊界，只保留純量與字串
function toView(slide: {
  id: string;
  isVisible: boolean;
  displayWidth: number;
  displayHeight: number;
  asset: { id: string; key: string; originalName: string | null };
}) {
  return {
    id: slide.id,
    assetId: slide.asset.id,
    url: mediaUrl(slide.asset.key),
    name: slide.asset.originalName ?? "未命名",
    isVisible: slide.isVisible,
    displayWidth: slide.displayWidth,
    displayHeight: slide.displayHeight,
  };
}
