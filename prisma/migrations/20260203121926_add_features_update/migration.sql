-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'RENDIMENTO';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "proofUrl" TEXT,
ADD COLUMN     "txHash" TEXT,
ADD COLUMN     "walletAddress" TEXT;
