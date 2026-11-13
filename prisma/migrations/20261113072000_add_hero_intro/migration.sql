-- CreateTable
CREATE TABLE "hero_intro" (
    "id" TEXT NOT NULL,
    "imageMode" BOOLEAN NOT NULL DEFAULT false,
    "assetId" TEXT,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_intro_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hero_intro" ADD CONSTRAINT "hero_intro_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
