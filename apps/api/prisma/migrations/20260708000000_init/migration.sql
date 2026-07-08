-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PUBLIC', 'REVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'USED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "VenueStatus" AS ENUM ('ACTIVE', 'PENDING', 'CLOSED');

-- CreateEnum
CREATE TYPE "VenueSource" AS ENUM ('SEED', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'FLAGGED', 'REMOVED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "RatingDimension" AS ENUM ('ATMOSPHERE', 'MUSIC', 'DRINKS', 'VALUE', 'CROWD', 'SERVICE', 'CLEANLINESS');

-- CreateEnum
CREATE TYPE "ReputationEventType" AS ENUM ('HELPFUL_VOTE', 'VERIFIED_VISIT', 'INVITE_CONVERTED', 'REVIEW_PUBLISHED', 'FLAGGED_CONTENT', 'ACCOUNT_BANNED');

-- CreateEnum
CREATE TYPE "ModerationTargetType" AS ENUM ('REVIEW', 'COMMENT', 'MEDIA', 'USER', 'VENUE');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PUBLIC',
    "reputationLevel" INTEGER NOT NULL DEFAULT 0,
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "cityId" TEXT,
    "invitedById" TEXT,
    "remainingInvites" INTEGER NOT NULL DEFAULT 0,
    "bannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invitePath" TEXT NOT NULL DEFAULT '/',
    "inviteDepth" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_otps" (
    "id" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "venue_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "priceRange" INTEGER,
    "status" "VenueStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "VenueSource" NOT NULL DEFAULT 'SEED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelTh" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_tags" (
    "venueId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "venue_tags_pkey" PRIMARY KEY ("venueId","tagId")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT,
    "overallRating" INTEGER NOT NULL,
    "verifiedVisit" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_subratings" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "dimension" "RatingDimension" NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "review_subratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_media" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "review_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_rating_aggregates" (
    "venueId" TEXT NOT NULL,
    "dimension" "RatingDimension" NOT NULL,
    "avgScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_rating_aggregates_pkey" PRIMARY KEY ("venueId","dimension")
);

-- CreateTable
CREATE TABLE "follows" (
    "followerId" TEXT NOT NULL,
    "followeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("followerId","followeeId")
);

-- CreateTable
CREATE TABLE "likes" (
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("userId","reviewId")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "distanceM" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputation_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReputationEventType" NOT NULL,
    "delta" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_flags" (
    "id" TEXT NOT NULL,
    "targetType" "ModerationTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'OPEN',
    "reportedById" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneHash_key" ON "users"("phoneHash");

-- CreateIndex
CREATE INDEX "users_cityId_idx" ON "users"("cityId");

-- CreateIndex
CREATE INDEX "users_invitePath_idx" ON "users"("invitePath");

-- CreateIndex
CREATE INDEX "phone_otps_phoneHash_createdAt_idx" ON "phone_otps"("phoneHash", "createdAt");

-- CreateIndex
CREATE INDEX "phone_otps_ipHash_createdAt_idx" ON "phone_otps"("ipHash", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "invites_code_key" ON "invites"("code");

-- CreateIndex
CREATE INDEX "invites_inviterId_idx" ON "invites"("inviterId");

-- CreateIndex
CREATE UNIQUE INDEX "venue_categories_name_key" ON "venue_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "venues_slug_key" ON "venues"("slug");

-- CreateIndex
CREATE INDEX "venues_cityId_status_idx" ON "venues"("cityId", "status");

-- CreateIndex
CREATE INDEX "reviews_venueId_status_idx" ON "reviews"("venueId", "status");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "review_subratings_reviewId_dimension_key" ON "review_subratings"("reviewId", "dimension");

-- CreateIndex
CREATE INDEX "review_media_reviewId_idx" ON "review_media"("reviewId");

-- CreateIndex
CREATE INDEX "comments_reviewId_idx" ON "comments"("reviewId");

-- CreateIndex
CREATE INDEX "checkins_userId_venueId_createdAt_idx" ON "checkins"("userId", "venueId", "createdAt");

-- CreateIndex
CREATE INDEX "reputation_events_userId_createdAt_idx" ON "reputation_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "moderation_flags_targetType_targetId_idx" ON "moderation_flags"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "moderation_flags_status_idx" ON "moderation_flags"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "venue_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_tags" ADD CONSTRAINT "venue_tags_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_tags" ADD CONSTRAINT "venue_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_subratings" ADD CONSTRAINT "review_subratings_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_media" ADD CONSTRAINT "review_media_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_rating_aggregates" ADD CONSTRAINT "venue_rating_aggregates_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followeeId_fkey" FOREIGN KEY ("followeeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputation_events" ADD CONSTRAINT "reputation_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
