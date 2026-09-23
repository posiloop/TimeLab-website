-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "TrackKey" AS ENUM ('TRACK_1', 'TRACK_2', 'TRACK_3');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_asset" (
    "id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE',
    "key" TEXT NOT NULL,
    "intrinsicWidth" INTEGER NOT NULL,
    "intrinsicHeight" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "originalName" TEXT,
    "deletedAt" TIMESTAMP(3),
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_slide" (
    "id" TEXT NOT NULL,
    "track" "TrackKey" NOT NULL,
    "assetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "displayWidth" INTEGER NOT NULL DEFAULT 275,
    "displayHeight" INTEGER NOT NULL DEFAULT 410,
    "alt" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_photo" (
    "id" TEXT NOT NULL,
    "track" "TrackKey" NOT NULL,
    "assetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "displayWidth" INTEGER NOT NULL,
    "displayHeight" INTEGER NOT NULL DEFAULT 760,
    "alt" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frame_animation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "webmId" TEXT NOT NULL,
    "mp4Id" TEXT NOT NULL,
    "displayWidth" INTEGER NOT NULL,
    "displayHeight" INTEGER NOT NULL,
    "rotate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "boxWidth" INTEGER NOT NULL,
    "boxHeight" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frame_animation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "coverId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_item" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "figmaNodeId" TEXT,
    "position" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_item" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_key_key" ON "media_asset"("key");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_checksum_key" ON "media_asset"("checksum");

-- CreateIndex
CREATE INDEX "media_asset_kind_createdAt_idx" ON "media_asset"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "media_asset_deletedAt_idx" ON "media_asset"("deletedAt");

-- CreateIndex
CREATE INDEX "hero_slide_track_isVisible_position_idx" ON "hero_slide"("track", "isVisible", "position");

-- CreateIndex
CREATE UNIQUE INDEX "hero_slide_track_position_key" ON "hero_slide"("track", "position");

-- CreateIndex
CREATE INDEX "event_photo_track_isVisible_position_idx" ON "event_photo"("track", "isVisible", "position");

-- CreateIndex
CREATE UNIQUE INDEX "event_photo_track_position_key" ON "event_photo"("track", "position");

-- CreateIndex
CREATE UNIQUE INDEX "frame_animation_slug_key" ON "frame_animation"("slug");

-- CreateIndex
CREATE INDEX "frame_animation_isVisible_position_idx" ON "frame_animation"("isVisible", "position");

-- CreateIndex
CREATE UNIQUE INDEX "frame_animation_position_key" ON "frame_animation"("position");

-- CreateIndex
CREATE UNIQUE INDEX "case_category_slug_key" ON "case_category"("slug");

-- CreateIndex
CREATE INDEX "case_category_isVisible_position_idx" ON "case_category"("isVisible", "position");

-- CreateIndex
CREATE UNIQUE INDEX "case_category_position_key" ON "case_category"("position");

-- CreateIndex
CREATE INDEX "case_item_categoryId_isVisible_position_idx" ON "case_item"("categoryId", "isVisible", "position");

-- CreateIndex
CREATE UNIQUE INDEX "case_item_categoryId_position_key" ON "case_item"("categoryId", "position");

-- CreateIndex
CREATE INDEX "faq_item_isVisible_position_idx" ON "faq_item"("isVisible", "position");

-- CreateIndex
CREATE UNIQUE INDEX "faq_item_position_key" ON "faq_item"("position");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_slide" ADD CONSTRAINT "hero_slide_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_photo" ADD CONSTRAINT "event_photo_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frame_animation" ADD CONSTRAINT "frame_animation_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frame_animation" ADD CONSTRAINT "frame_animation_webmId_fkey" FOREIGN KEY ("webmId") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frame_animation" ADD CONSTRAINT "frame_animation_mp4Id_fkey" FOREIGN KEY ("mp4Id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_category" ADD CONSTRAINT "case_category_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_item" ADD CONSTRAINT "case_item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "case_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_item" ADD CONSTRAINT "case_item_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
