// src/lib/services/marketDataService.ts
import { AssetPriceData, AssetTypeForAPI } from "@/lib/types";
import { fetchCryptoPrice } from "../../app/api/assets/coingecko";
import { fetchStockOrFiiPrice } from "../../app/api/assets/brapi";

// Cache em memória simples para evitar chamadas repetidas
const cache = new Map<string, { data: AssetPriceData; timestamp: number }>();
const CACHE_TTL_SECONDS = 5 * 60; // 5 minutos

export async function getAssetPrice(
  symbol: string,
  type: AssetTypeForAPI,
): Promise<AssetPriceData | null> {
  const cacheKey = `${type}_${symbol.toUpperCase()}`;
  const cachedItem = cache.get(cacheKey);

  // 1. Verifica se temos um item no cache e se ele não expirou
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
    // 2. Decide qual API chamar com base no tipo de ativo
    switch (type) {
      case AssetTypeForAPI.CRIPTO:
        // Para CoinGecko, o symbol deve ser o ID, ex: "bitcoin"
        fetchedData = await fetchCryptoPrice(symbol);
        break;
      case AssetTypeForAPI.ACAO:
      case AssetTypeForAPI.FII:
        // Para Brapi, o symbol deve ser o ticker, ex: "PETR4"
        fetchedData = await fetchStockOrFiiPrice(symbol);
        break;
      default:
        throw new Error(`Unsupported asset type: ${type}`);
    }

    // 3. Salva o novo dado no cache com o timestamp atual
    cache.set(cacheKey, { data: fetchedData, timestamp: Date.now() });

    return fetchedData;
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
    return null; // Retorna nulo em caso de erro para a API Route tratar
  }
}
