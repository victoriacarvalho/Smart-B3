// app/_data/get-dashboard/index.ts
"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
// Importação do AssetType corrigida
import { AssetType, Transaction } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { fetchStockOrFiiPrice } from "@/lib/services/api/brapi";
import { fetchCryptoPrice } from "@/lib/services/api/coingecko";
import { DashboardData, DashboardTransaction } from "./types";

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
  year: number,
  month: number,
): Promise<DashboardData> => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  const userAssets = await db.asset.findMany({
    where: {
      portfolio: { userId },
      quantity: { gt: 0 },
    },
  });

  if (userAssets.length === 0) {
    return {
      summary: {
        totalNetProfit: 0,
        totalTaxDue: 0,
        totalSold: 0,
        totalInvestedCost: 0,
        currentPortfolioValue: 0,
      },
      lastTransactions: [],
      profitByAssetType: [],
      portfolioAllocation: [],
    };
  }

  const pricePromises = userAssets.map((asset) =>
    fetchAssetPrice(asset.symbol, asset.type),
  );
  const prices = await Promise.all(pricePromises);

  let totalInvestedCost = new Decimal(0);
  let currentPortfolioValue = new Decimal(0);

  // CORREÇÃO: Usando Exclude para tipar o objeto
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

    // CORREÇÃO: Adicionado 'if' para não tentar alocar 'UNIFICADA'
    if (
      asset.type === AssetType.ACAO ||
      asset.type === AssetType.FII ||
      asset.type === AssetType.CRIPTO
    ) {
      portfolioAllocation[asset.type] =
        portfolioAllocation[asset.type].plus(assetCurrentValue);
    }
  });

  const monthlyResults = await db.monthlyResult.findMany({
    where: { userId, year, month },
  });

  const monthlyTotals = monthlyResults.reduce(
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

  const profitByAssetType = monthlyResults.reduce(
    (acc, result) => {
      // CORREÇÃO: Adicionado 'if' para não tentar alocar 'UNIFICADA'
      if (
        result.assetType === AssetType.ACAO ||
        result.assetType === AssetType.FII ||
        result.assetType === AssetType.CRIPTO
      ) {
        acc[result.assetType] = (acc[result.assetType] || new Decimal(0)).plus(
          result.netProfit,
        );
      }
      return acc;
    },
    // CORREÇÃO: Tipagem do acumulador
    {} as { [key in Exclude<AssetType, "UNIFICADA">]: Decimal },
  );

  const lastTransactionsFromDb = await db.transaction.findMany({
    where: { asset: { portfolio: { userId } } },
    include: { asset: { select: { symbol: true, type: true } } },
    orderBy: { date: "desc" },
    take: 5,
  });

  const lastTransactions = lastTransactionsFromDb.map(serializeTransaction);

  return {
    summary: {
      totalNetProfit: monthlyTotals.totalNetProfit.toNumber(),
      totalTaxDue: monthlyTotals.totalTaxDue.toNumber(),
      totalSold: monthlyTotals.totalSold.toNumber(),
      totalInvestedCost: totalInvestedCost.toNumber(),
      currentPortfolioValue: currentPortfolioValue.toNumber(),
    },
    lastTransactions,
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
