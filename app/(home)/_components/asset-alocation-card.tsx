// app/(home)/_components/asset-alocation-card.tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import AssetTypeIcon from "./asset-type-icon";
import { PortfolioAllocation } from "@/app/_data/get-dashboard/types";
import PercentageItem from "./percentagem-item";
import { AssetType } from "@prisma/client";

const VALID_ALLOCATION_TYPES: AssetType[] = [
  AssetType.ACAO,
  AssetType.FII,
  AssetType.CRIPTO,
];

const ASSET_TYPE_TITLES: Record<AssetType, string> = {
  [AssetType.ACAO]: "Ações",
  [AssetType.FII]: "FIIs",
  [AssetType.CRIPTO]: "Criptos",
  [AssetType.UNIFICADA]: "Unificada",
};
interface AssetAllocationCardProps {
  portfolioAllocation: PortfolioAllocation[];
}

const AssetAllocationCard = ({
  portfolioAllocation = [],
}: AssetAllocationCardProps) => {
  const validPortfolioAllocation = portfolioAllocation.filter(
    (item) => VALID_ALLOCATION_TYPES.includes(item.type) && item.value > 0,
  );

  const totalValue = validPortfolioAllocation.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const allocationWithPercentage = validPortfolioAllocation
    .map((item) => ({
      ...item,
      percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card className="flex flex-col p-6">
      <CardHeader className="pb-4">
        <CardTitle>Alocação por Ativo</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {allocationWithPercentage.length > 0 ? (
          allocationWithPercentage.map((item) => (
            <div key={item.type} className="space-y-2">
              <PercentageItem
                icon={<AssetTypeIcon type={item.type} className="h-5 w-5" />}
                title={ASSET_TYPE_TITLES[item.type]}
                value={parseFloat(item.percentage.toFixed(2))}
                type={item.type}
              />
              <Progress value={item.percentage} />
            </div>
          ))
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Sem dados de alocação.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetAllocationCard;
