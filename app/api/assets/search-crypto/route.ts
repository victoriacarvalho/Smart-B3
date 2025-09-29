// src/app/api/assets/search/route.ts
import { NextResponse } from "next/server";

// A estrutura de dados para o cache permanece a mesma
type CachedAsset = {
  symbol: string;
  name: string;
  type: "ACAO" | "FII" | "CRIPTO";
};

let cachedAssets: CachedAsset[] = [];
let lastFetchTimestamp = 0;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // Cache de 24 horas

// ===================================================================
// VERSÃO CORRIGIDA DA FUNÇÃO DE CACHE
// ===================================================================
async function populateAssetCache() {
  console.log("Iniciando a população do cache de ativos...");
  const allFetchedAssets: CachedAsset[] = [];

  try {
    const coingeckoResponse = await fetch(
      "https://api.coingecko.com/api/v3/coins/list",
    );
    if (!coingeckoResponse.ok)
      throw new Error(
        `CoinGecko API responded with status ${coingeckoResponse.status}`,
      );

    const coingeckoData = await coingeckoResponse.json();
    // ===================================================================
    // PASSO 2: CORRIGINDO O MAPEAMENTO DE DADOS DA COINGECKO
    // ===================================================================
    const cryptoAssets: CachedAsset[] = coingeckoData.map((coin: any) => ({
      apiId: coin.id, // O ID para buscar o preço
      symbol: coin.symbol.toUpperCase(), // O ticker que o usuário busca!
      name: coin.name,
      type: "CRIPTO",
    }));

    console.log(
      `Sucesso: ${cryptoAssets.length} ativos encontrados na CoinGecko.`,
    );
    allFetchedAssets.push(...cryptoAssets);
  } catch (error) {
    console.error("Falha ao buscar dados da CoinGecko:", error);
  }

  if (allFetchedAssets.length > 0) {
    cachedAssets = allFetchedAssets;
    lastFetchTimestamp = Date.now();
    console.log(`Cache final populado com ${cachedAssets.length} ativos.`);
  } else {
    console.error("Não foi possível popular o cache de nenhuma fonte.");
  }
}

export async function GET(request: Request) {
  if (
    cachedAssets.length === 0 ||
    Date.now() - lastFetchTimestamp > CACHE_DURATION_MS
  ) {
    await populateAssetCache();
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() || "";

  if (!query) {
    return NextResponse.json([]);
  }

  // ===================================================================
  // PASSO 3: CORRIGINDO A LÓGICA DE FILTRO PARA BUSCAR NO CAMPO CERTO
  // ===================================================================
  const filteredAssets = cachedAssets
    .filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(query) || // Busca pelo ticker (ex: "BTC")
        asset.name.toLowerCase().includes(query), // Busca pelo nome (ex: "Bitcoin")
    )
    .slice(0, 10);

  return NextResponse.json(filteredAssets);
}
