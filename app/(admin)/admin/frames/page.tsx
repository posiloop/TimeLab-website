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
    },
  });

  return (
    <FramesEditor
      frames={frames.map((frame) => ({
        id: frame.id,
        slug: frame.slug,
        alt: frame.alt,
        posterUrl: mediaUrl(frame.poster.key),
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
