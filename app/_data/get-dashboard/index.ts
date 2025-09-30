"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { AssetType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Busca e calcula os dados consolidados para o dashboard de um determinado mês e ano.
 * @param year O ano para o qual os dados serão buscados.
 * @param month O mês (1 a 12) para o qual os dados serão buscados.
 */
export const getDashboard = async (year: number, month: number) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  // --- 1. Buscar Resultados Mensais Pré-calculados ---
  // A fonte de verdade para lucro e impostos é o modelo 'MonthlyResult'.
  const monthlyResults = await db.monthlyResult.findMany({
    where: {
      userId,
      year,
      month,
    },
  });

  // --- 2. Calcular Totais do Mês a partir dos Resultados ---
  // Usamos 'reduce' para somar os valores de forma segura.
  const totals = monthlyResults.reduce(
    (acc, result) => {
      acc.totalNetProfit = acc.totalNetProfit.plus(result.netProfit);
      acc.totalTaxDue = acc.totalTaxDue.plus(result.taxDue);
      acc.totalSold = acc.totalSold.plus(result.totalSold);
      return acc;
    },
    {
      totalNetProfit: new Decimal(0),
      totalTaxDue: new Decimal(0),
      totalSold: new Decimal(0),
    },
  );

  // --- 3. Calcular o Custo Total Investido na Carteira (Posição Atual) ---
  // Isso nos dá uma visão do capital total alocado.
  const userAssets = await db.asset.findMany({
    where: { portfolio: { userId } },
    select: { quantity: true, averagePrice: true },
  });

  const totalInvestedCost = userAssets.reduce((acc, asset) => {
    const assetCost = asset.quantity.times(asset.averagePrice);
    return acc.plus(assetCost);
  }, new Decimal(0));

  // --- 4. Preparar Dados para Gráficos (Ex: Lucro por Tipo de Ativo) ---
  const profitByAssetType = monthlyResults.reduce(
    (acc, result) => {
      // Acumula o lucro para cada tipo de ativo
      acc[result.assetType] = (acc[result.assetType] || new Decimal(0)).plus(
        result.netProfit,
      );
      return acc;
    },
    {} as Record<AssetType, Decimal>,
  );

  // --- 5. Buscar as Últimas Transações ---
  // Lógica para buscar as transações mais recentes do usuário.
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const lastTransactions = await db.transaction.findMany({
    where: {
      asset: { portfolio: { userId } },
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    include: {
      asset: { select: { symbol: true, type: true } },
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  // --- 6. Retornar o Objeto Final do Dashboard ---
  return {
    totalNetProfit: Number(totals.totalNetProfit),
    totalTaxDue: Number(totals.totalTaxDue),
    totalSold: Number(totals.totalSold),
    totalInvestedCost: Number(totalInvestedCost),
    // Converte o objeto de lucros para um array mais fácil de usar no frontend
    profitByAssetType: Object.entries(profitByAssetType).map(
      ([type, profit]) => ({
        type: type as AssetType,
        profit: Number(profit),
      }),
    ),
    lastTransactions,
  };
};
