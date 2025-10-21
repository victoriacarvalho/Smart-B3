// app/(home)/_components/asset-allocation-card.tsx
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

interface AssetAllocationCardProps {
  portfolioAllocation: PortfolioAllocation[];
}

const AssetAllocationCard = ({
  portfolioAllocation = [],
}: AssetAllocationCardProps) => {
  const totalValue = portfolioAllocation.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const allocationWithPercentage = portfolioAllocation
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
                title={
                  item.type === "ACAO"
                    ? "Ações"
                    : item.type === "FII"
                      ? "FIIs"
                      : "Criptos"
                }
                value={parseFloat(item.percentage.toFixed(2))}
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
