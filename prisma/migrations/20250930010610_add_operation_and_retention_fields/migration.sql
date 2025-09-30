-- CreateEnum
CREATE TYPE "RetentionPeriod" AS ENUM ('CURTO_PRAZO', 'LONGO_PRAZO');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "operationType" "OperationType",
ADD COLUMN     "retentionPeriod" "RetentionPeriod";
