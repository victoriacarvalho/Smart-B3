// app/api/market/movers/route.ts
import { NextResponse } from "next/server";
import { AssetType } from "@prisma/client";

interface MarketMover {
  symbol: string;
  name?: string;
  changePercent?: number;
  type: AssetType;
  source: "brapi" | "coingecko";
}

async function fetchMarketMovers(): Promise<MarketMover[]> {
  const movers: MarketMover[] = [];
  console.log("Executando fetchMarketMovers...");

  try {
    const token = process.env.BRAPI_API_TOKEN;
    const brapiUrl = `https://brapi.dev/api/quote/list?sortBy=volume&limit=5`;
    const brapiResponse = await fetch(brapiUrl, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      next: { revalidate: 20 },
    });

    if (brapiResponse.ok) {
      const brapiData = await brapiResponse.json();
      if (brapiData?.stocks) {
        brapiData.stocks.forEach(
          (stock: { stock: string; name: string; change: number }) => {
            const type = stock.stock.endsWith("11")
              ? AssetType.FII
              : AssetType.ACAO;
            movers.push({
              symbol: stock.stock,
              name: stock.name,
              changePercent: stock.change,
              type: type,
              source: "brapi",
            });
          },
        );
      }
    } else {
      console.error("Brapi API falhou ao buscar movers:", brapiResponse.status);
    }

    const coingeckoUrl = `https://api.coingecko.com/api/v3/search/trending`;
    const coingeckoResponse = await fetch(coingeckoUrl, {
      next: { revalidate: 20 },
    });

    if (coingeckoResponse.ok) {
      const coingeckoData = await coingeckoResponse.json();
      if (coingeckoData?.coins) {
        coingeckoData.coins.slice(0, 5).forEach(
          (coinInfo: {
            item: {
              symbol: string;
              name: string;
              data: { price_change_percentage_24h: { brl: number } };
            };
          }) => {
            movers.push({
              symbol: coinInfo.item.symbol.toUpperCase(),
              name: coinInfo.item.name,
              changePercent:
                coinInfo.item.data?.price_change_percentage_24h?.brl ?? 0,
              type: AssetType.CRIPTO,
              source: "coingecko",
            });
          },
        );
      }
    } else {
      console.error(
        "CoinGecko API falhou ao buscar trending:",
        coingeckoResponse.status,
      );
    }
  } catch (error) {
    console.error("Erro ao buscar market movers:", error);
  }
  return movers;
}

export async function GET() {
  const movers = await fetchMarketMovers();
  return NextResponse.json(movers);
}
