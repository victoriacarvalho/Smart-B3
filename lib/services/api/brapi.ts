// lib/services/api/brapi.ts
import { AssetPriceData } from "@/lib/types";

export async function fetchStockOrFiiPrice(
  symbol: string,
): Promise<AssetPriceData | null> {
  const token = process.env.BRAPI_API_TOKEN;
  const url = `https://brapi.dev/api/quote/${symbol.toUpperCase()}`;

  try {
    const response = await fetch(url, {
      headers: {
        // CORREÇÃO: Envia o token no cabeçalho de autorização
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      // Retorna nulo em vez de lançar erro para a rota tratar
      console.error(
        `Brapi API failed for ${symbol} with status: ${response.status}`,
      );
      return null;
    }

    const data = await response.json();
    const result = data?.results?.[0];

    if (!result || !result.regularMarketPrice) {
      console.warn(`Price for symbol ${symbol} not found in Brapi response`);
      return null;
    }

    return {
      symbol: result.symbol,
      price: result.regularMarketPrice,
      source: "brapi",
    };
  } catch (error) {
    console.error("Error fetching from Brapi:", error);
    return null;
  }
}
