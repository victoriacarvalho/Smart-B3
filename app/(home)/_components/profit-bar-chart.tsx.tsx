// app/(home)/_components/profit-bar-chart.tsx.tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/app/_components/ui/chart";
import { AssetType } from "@prisma/client";
import {
  ASSET_TYPE_COLORS,
  ASSET_TYPE_LABELS,
} from "@/app/_constants/transactions";
import { ProfitByAssetType } from "@/app/_data/get-dashboard/types";

const chartConfig = {
  profit: {
    label: "Lucro/Prejuízo",
  },
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

interface ProfitBarChartProps {
  data: ProfitByAssetType[];
}

const ProfitBarChart = ({ data }: ProfitBarChartProps) => {
  const chartData = Array.isArray(data)
    ? data.map((item) => ({
        ...item,
        fill:
          item.profit >= 0
            ? `var(--color-${item.type})`
            : "hsl(var(--destructive))", // Use a cor 'destructive' para prejuízo
      }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultado do Mês por Tipo de Ativo</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="type"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  // --- CORREÇÃO AQUI ---
                  // Adicionamos o tipo 'AssetType' para a variável 'value'
                  tickFormatter={(value: AssetType) =>
                    chartConfig[value]?.label || value
                  }
                />
                <Tooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(value as number)
                      }
                    />
                  }
                />
                <Bar dataKey="profit" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Nenhum resultado para exibir no período.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitBarChart;
