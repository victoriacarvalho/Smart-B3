import { NextResponse } from "next/server";

type CachedCryptoAsset = {
  apiId: string;
  symbol: string;
  name: string;
  type: "CRIPTO";
};

let cachedAssets: CachedCryptoAsset[] = [];
let lastFetchTimestamp = 0;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

async function populateCryptoCache() {
  console.log("Iniciando a população do cache de criptomoedas...");
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/coins/list");
    if (!response.ok)
      throw new Error(`CoinGecko API responded with status ${response.status}`);

    const coingeckoData = await response.json();

    cachedAssets = coingeckoData.map(
      (coin: {
        id: string;
        symbol: string;
        name: string;
      }): CachedCryptoAsset => ({
        apiId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        type: "CRIPTO",
      }),
    );

    lastFetchTimestamp = Date.now();
    console.log(
      `Sucesso: Cache de cripto populado com ${cachedAssets.length} ativos.`,
    );
  } catch (error) {
    console.error("Falha ao buscar dados da CoinGecko:", error);
  }
}

export async function GET(request: Request) {
  if (
    cachedAssets.length === 0 ||
    Date.now() - lastFetchTimestamp > CACHE_DURATION_MS
  ) {
    await populateCryptoCache();
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() || "";

  if (!query) {
    return NextResponse.json([]);
  }

  const scoredResults = cachedAssets
    .map((asset) => {
      let score = 0;
      const lowerSymbol = asset.symbol.toLowerCase();
      const lowerName = asset.name.toLowerCase();

      // Prioridade máxima: correspondência exata do símbolo
      if (lowerSymbol === query) {
        score = 5;
      }
      // Prioridade alta: símbolo começa com a busca
      else if (lowerSymbol.startsWith(query)) {
        score = 4;
      }
      // Prioridade média: nome começa com a busca
      else if (lowerName.startsWith(query)) {
        score = 3;
      }
      // Prioridade baixa: nome ou símbolo contém a busca
      else if (lowerName.includes(query)) {
        score = 2;
      } else if (lowerSymbol.includes(query)) {
        score = 1;
      }

      return { ...asset, score };
    })
    .filter((asset) => asset.score > 0)
    .sort((a, b) => b.score - a.score);

  return NextResponse.json(scoredResults.slice(0, 10));
}
