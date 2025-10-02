import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { AssetType, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Função para buscar o preço de um único ativo
async function fetchAssetPrice(symbol: string, type: AssetType) {
  try {
    // A URL absoluta é necessária para chamadas fetch no lado do servidor
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/assets/price?symbol=${symbol}&type=${type}`;
    const response = await fetch(url, { next: { revalidate: 60 } }); // Cache de 1 minuto
    if (!response.ok) return null;
    const data = await response.json();
    return data.price as number;
  } catch (error) {
    console.error(`Falha ao buscar preço para ${symbol}:`, error);
    return null;
  }
}

export async function getDashboardData(month: string) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Não autorizado.");
  }

  const monthNumber = parseInt(month, 10);
  const year = new Date().getFullYear();

  const portfolio = await db.portfolio.findFirst({
    where: { userId },
    include: {
      assets: {
        where: { quantity: { gt: 0 } },
        include: {
          transactions: {
            orderBy: { date: "desc" },
          },
        },
      },
    },
  });

  if (!portfolio || portfolio.assets.length === 0) {
    return {
      summary: {
        totalNetProfit: 0,
        totalInvestedCost: 0,
        currentPortfolioValue: 0,
        totalSoldInMonth: 0,
        taxDueInMonth: 0,
      },
      lastTransactions: [],
      portfolioAllocation: [],
      profitByAssetType: [],
    };
  }

  // Busca de preços em paralelo
  const pricePromises = portfolio.assets.map((asset) =>
    fetchAssetPrice(asset.symbol, asset.type),
  );
  const prices = await Promise.all(pricePromises);

  // Cálculos principais
  let totalInvestedCost = new Decimal(0);
  let currentPortfolioValue = new Decimal(0);
  const portfolioAllocation: { [key in AssetType]: Decimal } = {
    ACAO: new Decimal(0),
    FII: new Decimal(0),
    CRIPTO: new Decimal(0),
  };

  portfolio.assets.forEach((asset, index) => {
    const currentPrice = new Decimal(prices[index] || 0);
    const assetCurrentValue = asset.quantity.times(currentPrice);

    totalInvestedCost = totalInvestedCost.plus(
      asset.quantity.times(asset.averagePrice),
    );
    currentPortfolioValue = currentPortfolioValue.plus(assetCurrentValue);
    portfolioAllocation[asset.type] =
      portfolioAllocation[asset.type].plus(assetCurrentValue);
  });

  const totalNetProfit = currentPortfolioValue.minus(totalInvestedCost);

  // Cálculos específicos do mês
  const salesInMonth = portfolio.assets.flatMap((asset) =>
    asset.transactions.filter(
      (tx) =>
        tx.type === TransactionType.VENDA &&
        tx.date.getMonth() + 1 === monthNumber &&
        tx.date.getFullYear() === year,
    ),
  );

  let totalSoldInMonth = new Decimal(0);
  let profitByAssetType: { [key in AssetType]: Decimal } = {
    ACAO: new Decimal(0),
    FII: new Decimal(0),
    CRIPTO: new Decimal(0),
  };

  for (const sale of salesInMonth) {
    const asset = portfolio.assets.find((a) => a.id === sale.assetId);
    if (asset) {
      const saleValue = sale.quantity.times(sale.unitPrice);
      const costOfSale = sale.quantity.times(asset.averagePrice);
      const profit = saleValue.minus(costOfSale).minus(sale.fees);

      totalSoldInMonth = totalSoldInMonth.plus(saleValue);
      profitByAssetType[asset.type] =
        profitByAssetType[asset.type].plus(profit);
    }
  }

  const monthlyProfit = Object.values(profitByAssetType).reduce(
    (sum, p) => sum.plus(p),
    new Decimal(0),
  );
  const taxDueInMonth = monthlyProfit.isPositive()
    ? monthlyProfit.times(0.15)
    : new Decimal(0);

  const allTransactions = portfolio.assets
    .flatMap((a) =>
      a.transactions.map((t) => ({
        ...t,
        asset: { symbol: a.symbol, type: a.type },
      })),
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    summary: {
      totalNetProfit: totalNetProfit.toNumber(),
      totalInvestedCost: totalInvestedCost.toNumber(),
      currentPortfolioValue: currentPortfolioValue.toNumber(),
      totalSoldInMonth: totalSoldInMonth.toNumber(),
      taxDueInMonth: taxDueInMonth.toNumber(),
    },
    lastTransactions: allTransactions.slice(0, 5),
    portfolioAllocation: Object.entries(portfolioAllocation).map(
      ([type, value]) => ({ type: type as AssetType, value: value.toNumber() }),
    ),
    profitByAssetType: Object.entries(profitByAssetType).map(
      ([type, profit]) => ({
        type: type as AssetType,
        profit: profit.toNumber(),
      }),
    ),
  };
}
