import { AssetType, Transaction } from "@prisma/client";

export interface ProfitByAssetType {
  type: AssetType;
  profit: number;
}

export type DashboardTransaction = Transaction & {
  asset: {
    symbol: string;
    type: AssetType;
  };
};

export interface PortfolioAllocation {
  type: AssetType;
  value: number;
}

export interface DashboardData {
  summary: {
    totalNetProfit: number;
    totalTaxDue: number;
    totalSold: number;
    totalInvestedCost: number;
    currentPortfolioValue: number;
  };
  profitByAssetType: ProfitByAssetType[];
  lastTransactions: DashboardTransaction[];
  portfolioAllocation: PortfolioAllocation[];
}
