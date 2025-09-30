import { AssetType, Transaction } from "@prisma/client";

/**
 * Define a estrutura de dados para o gráfico de Lucro por Tipo de Ativo.
 * Representa um único item no gráfico (ex: uma barra ou uma fatia da pizza).
 */
export interface ProfitByAssetType {
  type: AssetType;
  profit: number;
}

/**
 * Define o formato de uma transação recente, incluindo os dados
 * do ativo relacionado que são necessários para exibição.
 */
export type DashboardTransaction = Transaction & {
  asset: {
    symbol: string;
    type: AssetType;
  };
};

/**
 * A interface principal que define todos os dados retornados
 * pela server action `getDashboard`.
 */
export interface DashboardData {
  totalNetProfit: number;
  totalTaxDue: number;
  totalSold: number;
  totalInvestedCost: number;
  profitByAssetType: ProfitByAssetType[];
  lastTransactions: DashboardTransaction[];
}
