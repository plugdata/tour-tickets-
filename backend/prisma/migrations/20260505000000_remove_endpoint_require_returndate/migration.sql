-- Remove endPoint column from BusRound
ALTER TABLE "BusRound" DROP COLUMN "endPoint";

-- Make returnDate NOT NULL in BusRound
ALTER TABLE "BusRound" ALTER COLUMN "returnDate" SET NOT NULL;

-- Remove endPoint column from DraftBusRound
ALTER TABLE "DraftBusRound" DROP COLUMN "endPoint";

-- Make returnDate NOT NULL in DraftBusRound
ALTER TABLE "DraftBusRound" ALTER COLUMN "returnDate" SET NOT NULL;
