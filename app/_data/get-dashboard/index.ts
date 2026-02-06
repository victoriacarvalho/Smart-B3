"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { AssetType, Transaction } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { fetchStockOrFiiPrice } from "@/lib/services/api/brapi";
import { fetchCryptoPrice } from "@/lib/services/api/coingecko";
import { DashboardData, DashboardTransaction } from "./types";
import { endOfDay } from "date-fns";

async function fetchAssetPrice(symbol: string, type: AssetType) {
  try {
    let priceData;
    if (type === AssetType.ACAO || type === AssetType.FII) {
      priceData = await fetchStockOrFiiPrice(symbol);
    } else {
      priceData = await fetchCryptoPrice(symbol);
    }
    return priceData?.price ? new Decimal(priceData.price) : new Decimal(0);
  } catch (error) {
    console.error(`Falha ao buscar preço para ${symbol}:`, error);
    return new Decimal(0);
  }
}

function serializeTransaction(
  transaction: Transaction & { asset: { symbol: string; type: AssetType } },
): DashboardTransaction {
  return {
    id: transaction.id,
    type: transaction.type,
    date: transaction.date,
    quantity: transaction.quantity,
    unitPrice: transaction.unitPrice,
    fees: transaction.fees,
    assetId: transaction.assetId,
    asset: transaction.asset,
    isDayTrade: transaction.isDayTrade,
    createdAt: transaction.createdAt,
    operationType: transaction.operationType,
    retentionPeriod: transaction.retentionPeriod,
  };
}

export const getDashboard = async (
  startDate: Date,
  endDate: Date,
): Promise<DashboardData> => {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const effectiveEndDate = endOfDay(endDate);

  const userAssets = await db.asset.findMany({
    where: {
      portfolio: { userId },
      quantity: { gt: 0 },
    },
  });

  const periodTransactions = await db.transaction.findMany({
    where: {
      asset: { portfolio: { userId } },
      date: {
        gte: startDate,
        lte: effectiveEndDate,
      },
    },
    include: { asset: { select: { symbol: true, type: true } } },
    orderBy: { date: "desc" },
  });

  const startMonth = startDate.getMonth() + 1;
  const startYear = startDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endYear = endDate.getFullYear();

  const allMonthlyResults = await db.monthlyResult.findMany({
    where: {
      userId,
      year: { gte: startYear, lte: endYear },
    },
  });

  const filteredMonthlyResults = allMonthlyResults.filter((result) => {
    if (result.year > startYear && result.year < endYear) return true;

    if (result.year === startYear && result.year === endYear) {
      return result.month >= startMonth && result.month <= endMonth;
    }

    if (result.year === startYear) return result.month >= startMonth;

    if (result.year === endYear) return result.month <= endMonth;

    return false;
  });

  const summaryTotals = filteredMonthlyResults.reduce(
    (acc, result) => {
      acc.totalTaxDue = acc.totalTaxDue.plus(result.taxDue);
      acc.totalSold = acc.totalSold.plus(result.totalSold);
      acc.totalNetProfit = acc.totalNetProfit.plus(result.netProfit);
      return acc;
    },
    {
      totalTaxDue: new Decimal(0),
      totalSold: new Decimal(0),
      totalNetProfit: new Decimal(0),
    },
  );

  const profitByAssetType: {
    [key in Exclude<AssetType, "UNIFICADA">]: Decimal;
  } = {
    ACAO: new Decimal(0),
    FII: new Decimal(0),
    CRIPTO: new Decimal(0),
  };

  filteredMonthlyResults.forEach((result) => {
    if (
      result.assetType === AssetType.ACAO ||
      result.assetType === AssetType.FII ||
      result.assetType === AssetType.CRIPTO
    ) {
      profitByAssetType[result.assetType] = profitByAssetType[
        result.assetType
      ].plus(result.netProfit);
    }
  });

  const pricePromises = userAssets.map((asset) =>
    fetchAssetPrice(asset.symbol, asset.type),
  );
  const prices = await Promise.all(pricePromises);

  let totalInvestedCost = new Decimal(0);
  let currentPortfolioValue = new Decimal(0);

  const portfolioAllocation: {
    [key in Exclude<AssetType, "UNIFICADA">]: Decimal;
  } = {
    ACAO: new Decimal(0),
    FII: new Decimal(0),
    CRIPTO: new Decimal(0),
  };

  userAssets.forEach((asset, index) => {
    const currentPrice = prices[index];
    const assetCurrentValue = asset.quantity.times(currentPrice);

    totalInvestedCost = totalInvestedCost.plus(
      asset.quantity.times(asset.averagePrice),
    );
    currentPortfolioValue = currentPortfolioValue.plus(assetCurrentValue);

    if (
      asset.type === AssetType.ACAO ||
      asset.type === AssetType.FII ||
      asset.type === AssetType.CRIPTO
    ) {
      portfolioAllocation[asset.type] =
        portfolioAllocation[asset.type].plus(assetCurrentValue);
    }
  });

  return {
    summary: {
      totalNetProfit: summaryTotals.totalNetProfit.toNumber(),
      totalTaxDue: summaryTotals.totalTaxDue.toNumber(),
      totalSold: summaryTotals.totalSold.toNumber(),
      totalInvestedCost: totalInvestedCost.toNumber(),
      currentPortfolioValue: currentPortfolioValue.toNumber(),
    },
    lastTransactions: periodTransactions.slice(0, 5).map(serializeTransaction),

    profitByAssetType: Object.entries(profitByAssetType).map(
      ([type, profit]) => ({
        type: type as AssetType,
        profit: Number(profit),
      }),
    ),

    portfolioAllocation: Object.entries(portfolioAllocation).map(
      ([type, value]) => ({
        type: type as AssetType,
        value: value.toNumber(),
      }),
    ),
  };
};
