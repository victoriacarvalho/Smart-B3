"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import {
  ASSET_TYPE_BG_COLORS, // Importe as novas cores
  ASSET_TYPE_LABELS,
} from "@/app/_constants/transactions";
import { PortfolioAllocation } from "@/app/_data/get-dashboard/types";
import AssetTypeIcon from "./asset-type-icon";

interface AssetsDistributionProps {
  portfolioAllocation: PortfolioAllocation[];
}

const AssetsDistribution = ({
  portfolioAllocation,
}: AssetsDistributionProps) => {
  const totalValue = portfolioAllocation.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  return (
    <Card className="flex flex-col p-6">
      <CardHeader className="pb-4">
        <CardTitle>Distribuição da Carteira</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center space-y-6">
        {portfolioAllocation.length > 0 ? (
          portfolioAllocation.map((item) => {
            const percentage =
              totalValue > 0 ? (item.value / totalValue) * 100 : 0;

            return (
              <div key={item.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AssetTypeIcon type={item.type} className="h-4 w-4" />
                    <span className="font-medium">
                      {ASSET_TYPE_LABELS[item.type]}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.value)}
                    </span>
                  </div>
                </div>
                {/* Aplica a cor correta na barra de progresso */}
                <Progress
                  value={percentage}
                  indicatorClassName={ASSET_TYPE_BG_COLORS[item.type]}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {percentage.toFixed(1)}%
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum dado de alocação para exibir.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetsDistribution;
