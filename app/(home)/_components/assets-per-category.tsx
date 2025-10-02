"use client";

import { CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { ASSET_TYPE_LABELS } from "@/app/_constants/transactions";
import { ProfitByAssetType } from "@/app/_data/get-dashboard/types";
import { cn } from "@/lib/utils";

interface ProfitByAssetTypeCardProps {
  profitByAssetType: ProfitByAssetType[];
}

const ProfitByAssetTypeCard = ({
  profitByAssetType,
}: ProfitByAssetTypeCardProps) => {
  // 1. Calcula o lucro/prejuízo total para encontrar o percentual de cada tipo
  const totalValue = profitByAssetType.reduce(
    (sum, item) => sum + Math.abs(item.profit), // Usamos valor absoluto para a proporção
    0,
  );

  return (
    <ScrollArea className="h-full rounded-md border pb-6">
      <CardHeader>
        <CardTitle className="font-bold">
          Resultado do Mês por Tipo de Ativo
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Adiciona uma mensagem caso não haja dados */}
        {profitByAssetType.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum resultado de lucro ou prejuízo registrado para o período.
          </p>
        )}

        {profitByAssetType.map((item) => {
          // 2. Calcula o percentual de contribuição para o total (baseado no valor absoluto)
          const percentage =
            totalValue > 0 ? (Math.abs(item.profit) / totalValue) * 100 : 0;

          const isProfit = item.profit >= 0;

          return (
            <div key={item.type} className="space-y-2">
              <div className="flex w-full justify-between">
                <p className="text-sm font-bold">
                  {ASSET_TYPE_LABELS[item.type]}
                </p>
                {/* 3. Exibe o valor monetário formatado */}
                <p
                  className={cn(
                    "text-sm font-bold",
                    isProfit ? "text-green-600" : "text-red-600",
                  )}
                >
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.profit)}
                </p>
              </div>
              {/* 4. Barra de progresso com cor condicional */}
              <Progress
                value={percentage}
                indicatorClassName={isProfit ? "bg-green-600" : "bg-red-600"}
              />
            </div>
          );
        })}
      </CardContent>
    </ScrollArea>
  );
};

export default ProfitByAssetTypeCard;
