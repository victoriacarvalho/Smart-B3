-- AlterTable
ALTER TABLE "Darf" ADD COLUMN     "codigoReceita" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "isDayTrade" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AccumulatedLoss" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "operationType" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccumulatedLoss_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccumulatedLoss_userId_year_month_idx" ON "AccumulatedLoss"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "AccumulatedLoss_userId_year_month_operationType_key" ON "AccumulatedLoss"("userId", "year", "month", "operationType");

-- AddForeignKey
ALTER TABLE "AccumulatedLoss" ADD CONSTRAINT "AccumulatedLoss_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
