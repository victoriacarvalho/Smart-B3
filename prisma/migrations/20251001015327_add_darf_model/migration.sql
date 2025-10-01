-- CreateTable
CREATE TABLE "Darf" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "taxDue" DECIMAL(18,8) NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Darf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Darf_userId_year_month_assetType_key" ON "Darf"("userId", "year", "month", "assetType");

-- AddForeignKey
ALTER TABLE "Darf" ADD CONSTRAINT "Darf_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
