import { AssetPriceData } from "@/lib/types";

export async function fetchCryptoPrice(
  apiId: string,
): Promise<AssetPriceData | null> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${apiId.toLowerCase()}&vs_currencies=brl&include_24hr_change=true`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `CoinGecko API failed for ${apiId} with status: ${response.status}`,
      );
      return null;
    }
    const data = await response.json();
    const cryptoData = data[apiId.toLowerCase()];

    if (!cryptoData || cryptoData.brl === undefined) {
      console.warn(`Price for symbol ${apiId} not found in CoinGecko response`);
      return null;
    }

    return {
      symbol: apiId,
      price: cryptoData.brl,
      changePercent: cryptoData.brl_24h_change,
      change: cryptoData.brl * (cryptoData.brl_24h_change / 100),
      source: "coingecko",
    };
  } catch (error) {
    console.error("Error fetching from CoinGecko:", error);
    return null;
  }
}
