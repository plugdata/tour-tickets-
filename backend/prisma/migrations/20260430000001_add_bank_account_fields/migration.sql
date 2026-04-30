-- AlterTable
ALTER TABLE "BankAccount" ADD COLUMN "branch" TEXT,
                          ADD COLUMN "qrCodeUrl" TEXT,
                          ADD COLUMN "bookbankUrl" TEXT;

-- Set default for accountType (existing rows may have null if column was required)
ALTER TABLE "BankAccount" ALTER COLUMN "accountType" SET DEFAULT 'COMPANY';
