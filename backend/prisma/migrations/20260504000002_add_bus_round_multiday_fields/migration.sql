-- AlterTable: Add multiday trip support to BusRound
ALTER TABLE "BusRound" ADD COLUMN "returnDate" TIMESTAMP,
                        ADD COLUMN "vehicles" JSONB;
