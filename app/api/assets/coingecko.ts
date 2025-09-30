// src/lib/services/api/coingecko.ts
import { AssetPriceData } from "@/lib/types";

export async function fetchCryptoPrice(
  symbol: string,
): Promise<AssetPriceData> {
  // A API da CoinGecko usa IDs como "bitcoin", "ethereum", etc.
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=brl`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API failed with status: ${response.status}`);
    }
    const data = await response.json();

    // A resposta é {"bitcoin": {"brl": 350000}}. Precisamos extrair o preço.
    const price = data[symbol.toLowerCase()]?.brl;

    if (price === undefined) {
      throw new Error(
        `Price for symbol ${symbol} not found in CoinGecko response`,
      );
    }

    return {
      symbol: symbol,
      price: price,
      source: "coingecko",
    };
  } catch (error) {
    console.error("Error fetching from CoinGecko:", error);
    throw new Error("Failed to fetch crypto price from CoinGecko");
  }
}
