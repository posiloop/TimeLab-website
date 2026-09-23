import { prisma } from "@/app/server/db";
import { mediaUrl } from "@/app/server/s3";
import EventsEditor from "./EventsEditor";

export default async function EventsAdminPage() {
  const photos = await prisma.eventPhoto.findMany({
    orderBy: [{ track: "asc" }, { position: "asc" }],
    select: {
      id: true,
      track: true,
      isVisible: true,
      displayWidth: true,
      displayHeight: true,
      asset: {
        select: {
          key: true,
          originalName: true,
          intrinsicWidth: true,
          intrinsicHeight: true,
        },
      },
    },
  });

  const toView = (photo: (typeof photos)[number]) => ({
    id: photo.id,
    url: mediaUrl(photo.asset.key),
    name: photo.asset.originalName ?? "未命名",
    isVisible: photo.isVisible,
    displayWidth: photo.displayWidth,
    displayHeight: photo.displayHeight,
    // 版面寬與檔案實際寬不一致時要提醒使用者，故兩者都傳
    intrinsicWidth: photo.asset.intrinsicWidth,
    intrinsicHeight: photo.asset.intrinsicHeight,
  });

  return (
    <EventsEditor
      tracks={{
        TRACK_1: photos.filter((p) => p.track === "TRACK_1").map(toView),
        TRACK_2: photos.filter((p) => p.track === "TRACK_2").map(toView),
        TRACK_3: photos.filter((p) => p.track === "TRACK_3").map(toView),
      }}
    />
  );
}
