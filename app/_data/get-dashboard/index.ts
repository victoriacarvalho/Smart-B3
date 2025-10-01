"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { AssetType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { fetchStockOrFiiPrice } from "@/lib/services/api/brapi";
import { fetchCryptoPrice } from "@/lib/services/api/coingecko";

// Função auxiliar para buscar o preço de um único ativo
async function fetchAssetPrice(symbol: string, type: AssetType) {
  let priceData;
  if (type === AssetType.ACAO || type === AssetType.FII) {
    priceData = await fetchStockOrFiiPrice(symbol);
  } else {
    // Para cripto, o symbol no DB é o apiId (ex: "bitcoin")
    priceData = await fetchCryptoPrice(symbol);
  }
  return priceData?.price ? new Decimal(priceData.price) : new Decimal(0);
}

export const getDashboard = async (year: number, month: number) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  // Busca todos os ativos que o usuário possui em carteira
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
    };
  }

  // 1. Busca os preços atuais para todos os ativos em paralelo
  const pricePromises = userAssets.map((asset) =>
    fetchAssetPrice(asset.symbol, asset.type),
  );
  const prices = await Promise.all(pricePromises);

  // 2. Calcula os valores totais da carteira
  let totalInvestedCost = new Decimal(0);
  let currentPortfolioValue = new Decimal(0);

  userAssets.forEach((asset, index) => {
    const currentPrice = prices[index];
    const assetCurrentValue = asset.quantity.times(currentPrice);

    totalInvestedCost = totalInvestedCost.plus(
      asset.quantity.times(asset.averagePrice),
    );
    currentPortfolioValue = currentPortfolioValue.plus(assetCurrentValue);
  });

  const totalNetProfit = currentPortfolioValue.minus(totalInvestedCost);

  // 3. Busca os resultados mensais (impostos, vendas)
  const monthlyResults = await db.monthlyResult.findMany({
    where: { userId, year, month },
  });

  const monthlyTotals = monthlyResults.reduce(
    (acc, result) => {
      acc.totalTaxDue = acc.totalTaxDue.plus(result.taxDue);
      acc.totalSold = acc.totalSold.plus(result.totalSold);
      return acc;
    },
    {
      totalTaxDue: new Decimal(0),
      totalSold: new Decimal(0),
    },
  );

  const profitByAssetType = monthlyResults.reduce(
    (acc, result) => {
      acc[result.assetType] = (acc[result.assetType] || new Decimal(0)).plus(
        result.netProfit,
      );
      return acc;
    },
    {} as Record<AssetType, Decimal>,
  );

  // 4. Busca as últimas transações
  const lastTransactions = await db.transaction.findMany({
    where: { asset: { portfolio: { userId } } },
    include: { asset: { select: { symbol: true, type: true } } },
    orderBy: { date: "desc" },
    take: 5,
  });

  // 5. Retorna os dados estruturados para a página
  return {
    summary: {
      totalNetProfit: totalNetProfit.toNumber(),
      totalTaxDue: monthlyTotals.totalTaxDue.toNumber(),
      totalSold: monthlyTotals.totalSold.toNumber(),
      totalInvestedCost: totalInvestedCost.toNumber(),
      currentPortfolioValue: currentPortfolioValue.toNumber(),
    },
    lastTransactions: lastTransactions,
    profitByAssetType: Object.entries(profitByAssetType).map(
      ([type, profit]) => ({
        type: type as AssetType,
        profit: Number(profit),
      }),
    ),
  };
};
