// lib/services/api/coingecko.ts
import { AssetPriceData } from "@/lib/types";

export async function fetchCryptoPrice(
  apiId: string, // Recebe o ID da API (ex: "bitcoin")
): Promise<AssetPriceData | null> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${apiId.toLowerCase()}&vs_currencies=brl`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `CoinGecko API failed for ${apiId} with status: ${response.status}`,
      );
      return null;
    }
    const data = await response.json();
    const price = data[apiId.toLowerCase()]?.brl;

    if (price === undefined) {
      console.warn(`Price for symbol ${apiId} not found in CoinGecko response`);
      return null;
    }

    return {
      symbol: apiId, // Retornamos o mesmo ID que recebemos
      price: price,
      source: "coingecko",
    };
  } catch (error) {
    console.error("Error fetching from CoinGecko:", error);
    return null;
  }
}
