import { prisma } from "@/app/server/db";
import { mediaUrl } from "@/app/server/s3";
import FramesEditor from "./FramesEditor";

export default async function FramesAdminPage() {
  const frames = await prisma.frameAnimation.findMany({
    orderBy: { position: "asc" },
    select: {
      id: true,
      slug: true,
      alt: true,
      displayWidth: true,
      displayHeight: true,
      rotate: true,
      boxWidth: true,
      boxHeight: true,
      isVisible: true,
      poster: { select: { key: true } },
      webm: { select: { key: true } },
      mp4: { select: { key: true } },
      gif: { select: { key: true } },
    },
  });

  return (
    <FramesEditor
      frames={frames.map((frame) => ({
        id: frame.id,
        slug: frame.slug,
        alt: frame.alt,
        posterUrl: mediaUrl(frame.poster.key),
        webmUrl: mediaUrl(frame.webm.key),
        mp4Url: mediaUrl(frame.mp4.key),
        // 保留原始 GIF 之前上傳的拍貼框沒有這份資料，故可能為 undefined
        gifUrl: frame.gif ? mediaUrl(frame.gif.key) : undefined,
        displayWidth: frame.displayWidth,
        displayHeight: frame.displayHeight,
        rotate: frame.rotate,
        boxWidth: frame.boxWidth,
        boxHeight: frame.boxHeight,
        isVisible: frame.isVisible,
      }))}
    />
  );
}
