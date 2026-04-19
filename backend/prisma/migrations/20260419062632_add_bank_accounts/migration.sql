/*
  Warnings:

  - You are about to drop the column `birthDate` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `bloodType` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `dropoffPoint` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyName` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyPhone` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `foodAllergy` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `idCardImageUrl` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `namePrefix` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `nationalId` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `nickname` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `pickupPoint` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `seatNumber` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `vanOrder` on the `InsuranceForm` table. All the data in the column will be lost.
  - You are about to drop the column `passengerName` on the `SeatBooking` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[seatBookingId]` on the table `InsuranceForm` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seatBookingId` to the `InsuranceForm` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Addon" DROP CONSTRAINT "Addon_tripId_fkey";

-- AlterTable
ALTER TABLE "Addon" ALTER COLUMN "tripId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BusRound" ADD COLUMN     "extraPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "pickupPoints" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "InsuranceForm" DROP COLUMN "birthDate",
DROP COLUMN "bloodType",
DROP COLUMN "dropoffPoint",
DROP COLUMN "email",
DROP COLUMN "emergencyName",
DROP COLUMN "emergencyPhone",
DROP COLUMN "firstName",
DROP COLUMN "foodAllergy",
DROP COLUMN "idCardImageUrl",
DROP COLUMN "lastName",
DROP COLUMN "namePrefix",
DROP COLUMN "nationalId",
DROP COLUMN "nickname",
DROP COLUMN "phone",
DROP COLUMN "pickupPoint",
DROP COLUMN "seatNumber",
DROP COLUMN "vanOrder",
ADD COLUMN     "seatBookingId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SeatBooking" DROP COLUMN "passengerName",
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "dropoffPoint" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "emergencyName" TEXT,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "foodAllergy" TEXT,
ADD COLUMN     "idCardImageUrl" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "namePrefix" TEXT,
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pickupPoint" TEXT,
ADD COLUMN     "vanOrder" INTEGER;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "deposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "docUrl" TEXT;

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" SERIAL NOT NULL,
    "accountNo" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsurancePolicyContent" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "textContent" TEXT,
    "imageUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePolicyContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceCondition" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "iconClass" TEXT DEFAULT 'bi-check-circle-fill text-success',
    "sortOrder" INTEGER NOT NULL DEFAULT 99,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_accountNo_key" ON "BankAccount"("accountNo");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceForm_seatBookingId_key" ON "InsuranceForm"("seatBookingId");

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceForm" ADD CONSTRAINT "InsuranceForm_seatBookingId_fkey" FOREIGN KEY ("seatBookingId") REFERENCES "SeatBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
