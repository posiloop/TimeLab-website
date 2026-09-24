-- AlterTable
ALTER TABLE "frame_animation" ADD COLUMN     "gifId" TEXT;

-- AddForeignKey
ALTER TABLE "frame_animation" ADD CONSTRAINT "frame_animation_gifId_fkey" FOREIGN KEY ("gifId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
