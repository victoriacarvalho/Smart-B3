import { NextResponse } from "next/server";
import { AssetType } from "@prisma/client";

// Define um tipo para os dados que vamos retornar
interface MarketMover {
  symbol: string;
  name?: string;
  changePercent?: number;
  type: AssetType;
  source: "brapi" | "coingecko";
}

// Não precisamos mais de cache manual aqui.
// A função agora busca os dados (ou o cache do fetch) toda vez que é chamada.
async function fetchMarketMovers(): Promise<MarketMover[]> {
  const movers: MarketMover[] = [];
  console.log("Executando fetchMarketMovers..."); // Log para ver quando o fetch real ocorre

  try {
    const token = process.env.BRAPI_API_TOKEN;
    const brapiUrl = `https://brapi.dev/api/quote/list?sortBy=volume&limit=5`;
    const brapiResponse = await fetch(brapiUrl, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      next: { revalidate: 20 }, // Next.js vai guardar o cache desta chamada por 20s
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
      next: { revalidate: 20 }, // Next.js vai guardar o cache desta chamada por 20s
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

// GET Handler agora é mais simples
export async function GET(request: Request) {
  // Removemos o cache manual.
  // A chamada a fetchMarketMovers() usará o cache interno do Next.js (revalidate: 20).
  // Isso garante que seus usuários verão dados com no máximo 20 segundos
  // de idade, sem sobrecarregar as APIs externas.
  console.log("API /api/market/movers chamada.");
  const movers = await fetchMarketMovers();
  return NextResponse.json(movers);
}
