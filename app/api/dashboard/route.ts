// app/api/dashboard/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { AssetType, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month")
    ? parseInt(searchParams.get("month") as string, 10)
    : new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  try {
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
      return NextResponse.json({
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
      });
    }

    const pricePromises = portfolio.assets.map((asset) => {
      const identifier = asset.type === "CRIPTO" ? asset.symbol : asset.symbol;
      const url = `${new URL(request.url).origin}/api/assets/price?symbol=${identifier}&type=${asset.type}`;
      return fetch(url)
        .then((res) => res.json())
        .catch(() => null);
    });

    const priceResults = await Promise.all(pricePromises);
    const assetPrices: { [assetId: string]: Decimal } = {};
    priceResults.forEach((priceData, index) => {
      if (priceData && priceData.price) {
        const assetId = portfolio.assets[index].id;
        assetPrices[assetId] = new Decimal(priceData.price);
      }
    });

    let totalInvestedCost = new Decimal(0);
    let currentPortfolioValue = new Decimal(0);
    const portfolioAllocation: { [key in AssetType]: Decimal } = {
      ACAO: new Decimal(0),
      FII: new Decimal(0),
      CRIPTO: new Decimal(0),
    };

    for (const asset of portfolio.assets) {
      const currentPrice = assetPrices[asset.id] || new Decimal(0);
      const assetCurrentValue = asset.quantity.times(currentPrice);

      totalInvestedCost = totalInvestedCost.plus(
        asset.quantity.times(asset.averagePrice),
      );
      currentPortfolioValue = currentPortfolioValue.plus(assetCurrentValue);
      portfolioAllocation[asset.type] =
        portfolioAllocation[asset.type].plus(assetCurrentValue);
    }

    const totalNetProfit = currentPortfolioValue.minus(totalInvestedCost);

    const salesInMonth = portfolio.assets.flatMap((asset) =>
      asset.transactions.filter(
        (tx) =>
          tx.type === TransactionType.VENDA &&
          tx.date.getMonth() + 1 === month &&
          tx.date.getFullYear() === year,
      ),
    );

    let totalSold = new Decimal(0);
    let monthlyProfit = new Decimal(0);
    for (const sale of salesInMonth) {
      const asset = portfolio.assets.find((a) => a.id === sale.assetId);
      if (asset) {
        const saleValue = sale.quantity.times(sale.unitPrice);
        const costOfSale = sale.quantity.times(asset.averagePrice);
        const profit = saleValue.minus(costOfSale).minus(sale.fees);

        totalSold = totalSold.plus(saleValue);
        monthlyProfit = monthlyProfit.plus(profit);
      }
    }

    const totalTaxDue = monthlyProfit.isPositive()
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

    const responseData = {
      summary: {
        totalNetProfit: totalNetProfit.toNumber(),
        totalTaxDue: totalTaxDue.toNumber(),
        totalSold: totalSold.toNumber(),
        totalInvestedCost: totalInvestedCost.toNumber(),
        currentPortfolioValue: currentPortfolioValue.toNumber(),
      },
      lastTransactions: allTransactions.slice(0, 5),
      portfolioAllocation: Object.entries(portfolioAllocation).map(
        ([type, value]) => ({
          type: type as AssetType,
          value: value.toNumber(),
        }),
      ),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[API_DASHBOARD_GET]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar dados do dashboard." },
      { status: 500 },
    );
  }
}
