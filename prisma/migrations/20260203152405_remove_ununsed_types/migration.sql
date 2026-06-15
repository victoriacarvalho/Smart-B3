/*
  Warnings:

  - You are about to drop the column `proofUrl` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `txHash` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `walletAddress` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "proofUrl",
DROP COLUMN "txHash",
DROP COLUMN "walletAddress";
