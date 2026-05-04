-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContentType" ADD VALUE 'ANNOUNCEMENT';
ALTER TYPE "ContentType" ADD VALUE 'EXPERIENCE';
ALTER TYPE "ContentType" ADD VALUE 'GALLERY';
ALTER TYPE "ContentType" ADD VALUE 'INQUIRY';

-- AlterTable
ALTER TABLE "BusRound" ALTER COLUMN "returnDate" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "country" TEXT,
ADD COLUMN     "hotOrder" INTEGER NOT NULL DEFAULT 99,
ADD COLUMN     "isHot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tripType" TEXT NOT NULL DEFAULT 'DOMESTIC';

-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "altText" TEXT,
ADD COLUMN     "folder" TEXT DEFAULT 'general';

-- CreateTable
CREATE TABLE "DraftBusRound" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "busNumber" INTEGER NOT NULL DEFAULT 1,
    "startPoint" TEXT NOT NULL,
    "endPoint" TEXT NOT NULL,
    "departDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "duration" TEXT,
    "totalSeats" INTEGER,
    "responsiblePerson" TEXT,
    "extraPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pickupPoints" JSONB,
    "vehicles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftBusRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryAlbum" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 99,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryAlbum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" SERIAL NOT NULL,
    "albumId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 99,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- AddForeignKey
ALTER TABLE "DraftBusRound" ADD CONSTRAINT "DraftBusRound_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "GalleryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
