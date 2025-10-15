// src/lib/services/marketDataService.ts
import { AssetPriceData, AssetTypeForAPI } from "@/lib/types";
import { fetchCryptoPrice } from "./api/coingecko";
import { fetchStockOrFiiPrice } from "./api/brapi";

const cache = new Map<string, { data: AssetPriceData; timestamp: number }>();
const CACHE_TTL_SECONDS = 3 * 60;

export async function getAssetPrice(
  symbol: string,
  type: AssetTypeForAPI,
): Promise<AssetPriceData | null> {
  const cacheKey = `${type}_${symbol.toUpperCase()}`;
  const cachedItem = cache.get(cacheKey);

  if (
    cachedItem &&
    (Date.now() - cachedItem.timestamp) / 1000 < CACHE_TTL_SECONDS
  ) {
    console.log(`CACHE HIT for ${cacheKey}`);
    return cachedItem.data;
  }

  console.log(`CACHE MISS for ${cacheKey}`);
  let fetchedData: AssetPriceData;

  try {
    switch (type) {
      case AssetTypeForAPI.CRIPTO:
        fetchedData = await fetchCryptoPrice(symbol);
        break;
      case AssetTypeForAPI.ACAO:
      case AssetTypeForAPI.FII:
        fetchedData = await fetchStockOrFiiPrice(symbol);
        break;
      default:
        throw new Error(`Unsupported asset type: ${type}`);
    }

    cache.set(cacheKey, { data: fetchedData, timestamp: Date.now() });

    return fetchedData;
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
    return null;
  }
}
