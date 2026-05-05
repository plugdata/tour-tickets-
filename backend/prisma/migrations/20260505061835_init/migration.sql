-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STUFF', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'FULL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TRIP_POST', 'BLOG', 'FAQ', 'ABOUT', 'SERVICE', 'ANNOUNCEMENT', 'EXPERIENCE', 'GALLERY', 'INQUIRY');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" SERIAL NOT NULL,
    "accountNo" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branch" TEXT,
    "accountType" TEXT NOT NULL DEFAULT 'COMPANY',
    "imageUrl" TEXT,
    "qrCodeUrl" TEXT,
    "bookbankUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "deposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "docUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tripType" TEXT NOT NULL DEFAULT 'DOMESTIC',
    "country" TEXT,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "hotOrder" INTEGER NOT NULL DEFAULT 99,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoudeStack" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "roundname" TEXT NOT NULL,
    "deteroudestr" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoudeStack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusRound" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "roudeStackId" INTEGER NOT NULL,
    "busNumber" INTEGER NOT NULL DEFAULT 1,
    "startPoint" TEXT NOT NULL,
    "departDate" TIMESTAMP(3) NOT NULL,
    "duration" TEXT,
    "totalSeats" INTEGER NOT NULL,
    "bookedSeats" INTEGER NOT NULL DEFAULT 0,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "responsiblePerson" TEXT,
    "extraPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pickupPoints" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "busRoundId" INTEGER NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "bookingType" TEXT NOT NULL DEFAULT 'SINGLE',
    "foodAllergy" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAddon" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "addonId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BookingAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "PaymentType" NOT NULL DEFAULT 'FULL',
    "slipUrl" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER,
    "type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "linkUrl" TEXT,
    "authorName" TEXT,
    "tags" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" SERIAL NOT NULL,
    "busRoundId" INTEGER,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceForm" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "seatBookingId" INTEGER NOT NULL,
    "beneficiaryName" TEXT,
    "beneficiaryRelation" TEXT,
    "beneficiaryRelationOther" TEXT,
    "coverageAmount" DOUBLE PRECISION NOT NULL DEFAULT 1000000,
    "consentPolicyRead" BOOLEAN NOT NULL DEFAULT false,
    "consentTermsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "consent4WD" BOOLEAN NOT NULL DEFAULT false,
    "consentDomesticOnly" BOOLEAN NOT NULL DEFAULT false,
    "customConditions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "issuedPolicyNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancelLog" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "cancelledById" INTEGER NOT NULL,
    "cancelledByUsername" TEXT NOT NULL,
    "cancelledByName" TEXT NOT NULL,
    "cancelReason" TEXT,
    "cancelledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancelLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatBooking" (
    "id" SERIAL NOT NULL,
    "busRoundId" INTEGER NOT NULL,
    "bookingId" INTEGER,
    "seatNumber" INTEGER NOT NULL,
    "vanOrder" INTEGER,
    "namePrefix" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "nickname" TEXT,
    "gender" TEXT,
    "nationalId" TEXT,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "bloodType" TEXT,
    "idCardImageUrl" TEXT,
    "foodAllergy" TEXT,
    "pickupPoint" TEXT,
    "dropoffPoint" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "sessionToken" TEXT,
    "holdExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingSession" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "busRoundId" INTEGER,
    "step" INTEGER NOT NULL DEFAULT 1,
    "selectedSeats" TEXT,
    "customerData" TEXT,
    "addonsData" TEXT,
    "bookingId" INTEGER,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSession_pkey" PRIMARY KEY ("id")
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
    "folder" TEXT DEFAULT 'general',
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_accountNo_key" ON "BankAccount"("accountNo");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceForm_seatBookingId_key" ON "InsuranceForm"("seatBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "SeatBooking_busRoundId_seatNumber_key" ON "SeatBooking"("busRoundId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSession_token_key" ON "BookingSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- AddForeignKey
ALTER TABLE "RoudeStack" ADD CONSTRAINT "RoudeStack_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusRound" ADD CONSTRAINT "BusRound_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusRound" ADD CONSTRAINT "BusRound_roudeStackId_fkey" FOREIGN KEY ("roudeStackId") REFERENCES "RoudeStack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_busRoundId_fkey" FOREIGN KEY ("busRoundId") REFERENCES "BusRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "Addon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceForm" ADD CONSTRAINT "InsuranceForm_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceForm" ADD CONSTRAINT "InsuranceForm_seatBookingId_fkey" FOREIGN KEY ("seatBookingId") REFERENCES "SeatBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatBooking" ADD CONSTRAINT "SeatBooking_busRoundId_fkey" FOREIGN KEY ("busRoundId") REFERENCES "BusRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatBooking" ADD CONSTRAINT "SeatBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "GalleryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
