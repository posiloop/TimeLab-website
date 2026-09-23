import { unstable_cache } from "next/cache";
import type { MarqueeItem } from "@/app/components/Marquee";
import type { TrackKey } from "@/app/generated/prisma/enums";
import { prisma } from "../db";
import { mediaUrl } from "../s3";
import { TAGS } from "./tags";

export type EventTracks = Record<TrackKey, MarqueeItem[]>;

/** 與主視覺不同，三軌各有自己的 7 張圖，且每張寬度不同（570/1013/1140） */
async function loadEventTracks(): Promise<EventTracks> {
  const photos = await prisma.eventPhoto.findMany({
    where: { isVisible: true, asset: { deletedAt: null } },
    orderBy: [{ track: "asc" }, { position: "asc" }],
    select: {
      track: true,
      alt: true,
      displayWidth: true,
      displayHeight: true,
      asset: { select: { key: true } },
    },
  });

  const tracks: EventTracks = { TRACK_1: [], TRACK_2: [], TRACK_3: [] };

  for (const photo of photos) {
    tracks[photo.track].push({
      src: mediaUrl(photo.asset.key),
      width: photo.displayWidth,
      height: photo.displayHeight,
      ...(photo.alt ? { alt: photo.alt } : {}),
    });
  }

  return tracks;
}

export const getEventTracks = unstable_cache(
  loadEventTracks,
  ["content", "events", "tracks", "v1"],
  { tags: [TAGS.events], revalidate: false },
);
