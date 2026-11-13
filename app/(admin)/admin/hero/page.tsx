import { prisma } from "@/app/server/db";
import { mediaUrl } from "@/app/server/s3";
import HeroEditor from "./HeroEditor";
import HeroIntroEditor from "./HeroIntroEditor";

export default async function HeroAdminPage() {
  const [slides, intro] = await Promise.all([
    prisma.heroSlide.findMany({
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
    }),
    // 左側介紹區的 singleton。只讀目前這張圖與開關狀態
    prisma.heroIntro.findFirst({
      select: {
        imageMode: true,
        asset: {
          select: { id: true, key: true, originalName: true, deletedAt: true },
        },
      },
    }),
  ]);

  const introView = {
    imageMode: intro?.imageMode ?? false,
    image:
      intro?.asset && intro.asset.deletedAt === null
        ? {
            id: intro.asset.id,
            url: mediaUrl(intro.asset.key),
            name: intro.asset.originalName ?? "主視覺圖",
          }
        : null,
  };

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 text-brand-ink">首頁主視覺</h1>
        <p className="mt-1 text-sm text-brand-ink/70">
          網站最上方的主視覺：左側的介紹區（可切換成圖片做節日裝飾），
          以及右側傾斜的三排相框。
        </p>
      </div>

      <HeroIntroEditor intro={introView} />

      <HeroEditor
        library={[...library.values()]}
        tracks={{
          TRACK_1: tracks.TRACK_1.map(toView),
          TRACK_2: tracks.TRACK_2.map(toView),
          TRACK_3: tracks.TRACK_3.map(toView),
        }}
      />
    </div>
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
