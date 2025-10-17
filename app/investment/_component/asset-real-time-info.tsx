"use client";

import { useState, useEffect } from "react";
import { AssetType } from "@prisma/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { cn } from "@/app/_lib/utils";

interface AssetRealTimeInfoProps {
  assetSymbol: string;
  assetType: AssetType;
}

interface MarketData {
  price: number;
  changePercent: number;
  change: number;
}

const AssetRealTimeInfo = ({
  assetSymbol,
  assetType,
}: AssetRealTimeInfoProps) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/assets/price?symbol=${assetSymbol}&type=${assetType}`,
        );
        if (!response.ok) {
          throw new Error("Falha ao buscar dados de mercado.");
        }
        const data = await response.json();
        setMarketData(data);
      } catch (error) {
        console.error(error);
        setMarketData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 20000);

    return () => clearInterval(interval);
  }, [assetSymbol, assetType]);

  const isPositive = marketData && marketData.changePercent >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cotação em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="animate-pulse text-muted-foreground">Carregando...</p>
        ) : marketData ? (
          <div>
            <p className="text-3xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(marketData.price)}
            </p>
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-semibold",
                isPositive ? "text-green-500" : "text-red-500",
              )}
            >
              <span>
                {isPositive ? "+" : ""}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(marketData.change)}
              </span>
              <span>({marketData.changePercent.toFixed(2)}%)</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Atualizado em: {new Date().toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-red-500">
            Não foi possível carregar os dados de cotação.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetRealTimeInfo;
