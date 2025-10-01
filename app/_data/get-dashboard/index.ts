"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { AssetType, Transaction } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { fetchStockOrFiiPrice } from "@/lib/services/api/brapi";
import { fetchCryptoPrice } from "@/lib/services/api/coingecko";
import { DashboardData, DashboardTransaction } from "./types";

// Função auxiliar para buscar o preço de um único ativo de forma segura
async function fetchAssetPrice(symbol: string, type: AssetType) {
  try {
    let priceData;
    if (type === AssetType.ACAO || type === AssetType.FII) {
      priceData = await fetchStockOrFiiPrice(symbol);
    } else {
      // Para cripto, o symbol no DB é o apiId (ex: "bitcoin")
      priceData = await fetchCryptoPrice(symbol);
    }
    // Retorna o preço como Decimal ou 0 se a busca falhar
    return priceData?.price ? new Decimal(priceData.price) : new Decimal(0);
  } catch (error) {
    console.error(`Falha ao buscar preço para ${symbol}:`, error);
    return new Decimal(0); // Retorna 0 em caso de erro para não quebrar a aplicação
  }
}

// Função para converter Decimals em Numbers para uma transação (evita erro de serialização)
function serializeTransaction(
  transaction: Transaction & { asset: { symbol: string; type: AssetType } },
): DashboardTransaction {
  return {
    ...transaction,
    quantity: transaction.quantity.toNumber(),
    unitPrice: transaction.unitPrice.toNumber(),
    fees: transaction.fees.toNumber(),
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

  // Retorna um estado vazio se o usuário não tiver ativos
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

  // Busca os preços atuais para todos os ativos em paralelo
  const pricePromises = userAssets.map((asset) =>
    fetchAssetPrice(asset.symbol, asset.type),
  );
  const prices = await Promise.all(pricePromises);

  // Calcula os valores totais da carteira
  let totalInvestedCost = new Decimal(0);
  let currentPortfolioValue = new Decimal(0);
  const portfolioAllocation: { [key in AssetType]: Decimal } = {
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
    portfolioAllocation[asset.type] =
      portfolioAllocation[asset.type].plus(assetCurrentValue);
  });

  const totalNetProfit = currentPortfolioValue.minus(totalInvestedCost);

  // Busca os resultados mensais (impostos, vendas, lucros do mês)
  const monthlyResults = await db.monthlyResult.findMany({
    where: { userId, year, month },
  });

  const monthlyTotals = monthlyResults.reduce(
    (acc, result) => {
      acc.totalTaxDue = acc.totalTaxDue.plus(result.taxDue);
      acc.totalSold = acc.totalSold.plus(result.totalSold);
      return acc;
    },
    { totalTaxDue: new Decimal(0), totalSold: new Decimal(0) },
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

  // Busca as últimas transações
  const lastTransactionsFromDb = await db.transaction.findMany({
    where: { asset: { portfolio: { userId } } },
    include: { asset: { select: { symbol: true, type: true } } },
    orderBy: { date: "desc" },
    take: 5,
  });

  // Converte Decimals para Numbers antes de retornar
  const lastTransactions = lastTransactionsFromDb.map(serializeTransaction);

  return {
    summary: {
      totalNetProfit: totalNetProfit.toNumber(),
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
