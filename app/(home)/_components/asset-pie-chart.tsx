"use client";

import { Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/_components/ui/chart";
import { AssetType } from "@prisma/client";
import {
  ASSET_TYPE_COLORS,
  ASSET_TYPE_LABELS,
} from "@/app/_constants/transactions";
import AssetTypeIcon from "./asset-type-icon";
import PercentageItem from "./percentagem-item"; // Importando o novo componente

const chartConfig = {
  [AssetType.ACAO]: {
    label: ASSET_TYPE_LABELS.ACAO,
    color: ASSET_TYPE_COLORS.ACAO,
  },
  [AssetType.FII]: {
    label: ASSET_TYPE_LABELS.FII,
    color: ASSET_TYPE_COLORS.FII,
  },
  [AssetType.CRIPTO]: {
    label: ASSET_TYPE_LABELS.CRIPTO,
    color: ASSET_TYPE_COLORS.CRIPTO,
  },
} satisfies ChartConfig;

interface PortfolioAllocation {
  type: AssetType;
  value: number;
}

interface AssetPieChartProps {
  portfolioAllocation: PortfolioAllocation[];
}

const AssetPieChart = ({ portfolioAllocation = [] }: AssetPieChartProps) => {
  const chartData = portfolioAllocation
    .filter((item) => item.value > 0)
    .map((item) => ({
      ...item,
      fill: ASSET_TYPE_COLORS[item.type],
    }));

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="flex flex-col p-6">
      <CardHeader className="pb-2">
        <CardTitle>Alocação da Carteira</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center pb-0">
        {chartData.length > 0 ? (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square w-full max-w-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="type"
                    innerRadius={60}
                    strokeWidth={5}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="mt-4 w-full space-y-4">
              {chartData.map((item) => (
                <PercentageItem
                  key={item.type}
                  icon={<AssetTypeIcon type={item.type} className="h-4 w-4" />}
                  title={chartConfig[item.type].label}
                  value={item.value}
                  percentage={(item.value / totalValue) * 100}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              Adicione ativos à sua carteira para ver a alocação.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetPieChart;
