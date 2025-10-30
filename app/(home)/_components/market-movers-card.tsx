"use client";

import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import AssetTypeIcon from "./asset-type-icon";
import { AssetType } from "@prisma/client";
import { cn } from "@/app/_lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface MarketMover {
  symbol: string;
  name?: string;
  changePercent?: number;
  type: AssetType;
  source: "brapi" | "coingecko";
}

const MarketMoversCard = () => {
  const [movers, setMovers] = useState<MarketMover[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMovers = () => {
    fetch("/api/market/movers")
      .then((res) => res.json())
      .then((data: MarketMover[]) => {
        setMovers(data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchMovers();

    const interval = setInterval(() => {
      fetchMovers();
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  return (
    <ScrollArea className="h-full rounded-md border">
      <CardHeader>
        <CardTitle className="font-bold">Ativos em Destaque</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading && (
          <p className="animate-pulse pt-4 text-sm text-muted-foreground">
            Carregando ativos...
          </p>
        )}

        {!isLoading && movers.length === 0 && (
          <p className="pt-4 text-sm text-muted-foreground">
            Não foi possível carregar os ativos em destaque.
          </p>
        )}

        {!isLoading &&
          movers.slice(0, 3).map((mover, index) => {
            const change = mover.changePercent ?? 0;
            const isPositive = change >= 0;

            return (
              <div
                key={`${mover.symbol}-${index}`}
                className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <AssetTypeIcon type={mover.type} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">
                      {mover.symbol.toUpperCase()}
                    </p>
                    <p className="max-w-[150px] truncate text-xs text-muted-foreground">
                      {mover.name ?? "Nome indisponível"}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-1 text-sm font-semibold",
                    isPositive ? "text-green-600" : "text-red-600",
                  )}
                >
                  {isPositive ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  <span>{change.toFixed(2)}%</span>
                </div>
              </div>
            );
          })}
      </CardContent>
    </ScrollArea>
  );
};

export default MarketMoversCard;
