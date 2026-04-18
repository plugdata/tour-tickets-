-- Add missing fields to BusRound
ALTER TABLE "BusRound" ADD COLUMN "responsiblePerson" TEXT;

-- Add missing fields to Booking
ALTER TABLE "Booking" ADD COLUMN "bookingType" TEXT NOT NULL DEFAULT 'SINGLE';
ALTER TABLE "Booking" ADD COLUMN "recordedBy" TEXT;

-- CreateTable InsuranceForm
CREATE TABLE "InsuranceForm" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "namePrefix" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nickname" TEXT,
    "nationalId" TEXT,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "bloodType" TEXT,
    "foodAllergy" TEXT,
    "pickupPoint" TEXT,
    "dropoffPoint" TEXT,
    "vanOrder" INTEGER,
    "seatNumber" INTEGER,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "beneficiaryName" TEXT,
    "beneficiaryRelation" TEXT,
    "beneficiaryRelationOther" TEXT,
    "consentPolicyRead" BOOLEAN NOT NULL DEFAULT false,
    "consentTermsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "consent4WD" BOOLEAN NOT NULL DEFAULT false,
    "consentDomesticOnly" BOOLEAN NOT NULL DEFAULT false,
    "customConditions" TEXT,
    "idCardImageUrl" TEXT,
    "coverageAmount" DOUBLE PRECISION NOT NULL DEFAULT 1000000,
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

ALTER TABLE "InsuranceForm" ADD CONSTRAINT "InsuranceForm_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable CancelLog
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
