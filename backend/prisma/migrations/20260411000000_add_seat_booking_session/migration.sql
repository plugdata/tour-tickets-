-- Add duration to BusRound
ALTER TABLE "BusRound" ADD COLUMN "duration" TEXT;

-- CreateTable SeatBooking
CREATE TABLE "SeatBooking" (
    "id" SERIAL NOT NULL,
    "busRoundId" INTEGER NOT NULL,
    "bookingId" INTEGER,
    "seatNumber" INTEGER NOT NULL,
    "gender" TEXT,
    "passengerName" TEXT,
    "sessionToken" TEXT,
    "holdExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeatBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeatBooking_busRoundId_seatNumber_key" ON "SeatBooking"("busRoundId", "seatNumber");

-- AddForeignKey
ALTER TABLE "SeatBooking" ADD CONSTRAINT "SeatBooking_busRoundId_fkey"
    FOREIGN KEY ("busRoundId") REFERENCES "BusRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatBooking" ADD CONSTRAINT "SeatBooking_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable BookingSession
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

-- CreateIndex
CREATE UNIQUE INDEX "BookingSession_token_key" ON "BookingSession"("token");
