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
import { ProfitByAssetType } from "../types";
import {
  ASSET_TYPE_COLORS,
  ASSET_TYPE_LABELS,
} from "@/app/_constants/transactions";
import AssetTypeIcon from "./asset-type-icon";

// 1. Configuração do gráfico para os tipos de ativo
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

interface AssetProfitPieChartProps {
  profitByAssetType: ProfitByAssetType[];
}

const AssetProfitPieChart = ({
  profitByAssetType,
}: AssetProfitPieChartProps) => {
  // 2. Filtramos para exibir apenas os ativos que deram LUCRO
  const chartData = profitByAssetType
    .filter((item) => item.profit > 0)
    .map((item) => ({
      ...item,
      fill: ASSET_TYPE_COLORS[item.type], // Adiciona a cor para a fatia do gráfico
    }));

  return (
    <Card className="flex flex-col p-6">
      <CardHeader className="pb-2">
        <CardTitle>Composição do Lucro</CardTitle>
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
                    dataKey="profit"
                    nameKey="type"
                    innerRadius={60}
                    strokeWidth={5}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* 3. Legenda dinâmica baseada nos dados */}
            <div className="mt-4 w-full space-y-3">
              {chartData.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <AssetTypeIcon type={item.type} className="h-4 w-4" />
                    <span className="font-medium">
                      {chartConfig[item.type].label}
                    </span>
                  </div>
                  <span className="font-bold text-green-600">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.profit)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          // 4. Mensagem para quando não há lucro a ser exibido
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              Não houve lucro para exibir no período.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetProfitPieChart;
