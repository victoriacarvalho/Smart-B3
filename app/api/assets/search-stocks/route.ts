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

  // --- Bloco 1: Buscar Ações e FIIs da Brapi ---
  try {
    const brapiResponse = await fetch("https://brapi.dev/api/quote/list");
    if (!brapiResponse.ok)
      throw new Error(
        `Brapi API responded with status ${brapiResponse.status}`,
      );

    const brapiData = await brapiResponse.json();
    brapiData.stocks.forEach((stock: any) => {
      // A Brapi não diferencia Ação de FII, podemos tratar no frontend se necessário
      allFetchedAssets.push({
        symbol: stock.stock,
        name: stock.name,
        type: "ACAO",
      });
    });
    console.log(
      `Sucesso: ${allFetchedAssets.length} ativos encontrados na Brapi.`,
    );
  } catch (error) {
    // Se a Brapi falhar, apenas registramos o erro e continuamos
    console.error("Falha ao buscar dados da Brapi:", error);
  }

  // Se conseguimos buscar qualquer dado, atualizamos o cache
  if (allFetchedAssets.length > 0) {
    cachedAssets = allFetchedAssets;
    lastFetchTimestamp = Date.now();
    console.log(`Cache final populado com ${cachedAssets.length} ativos.`);
  } else {
    console.error("Não foi possível popular o cache de nenhuma fonte.");
  }
}

export async function GET(request: Request) {
  // Verifica se o cache está vazio ou expirou
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

  // Adicionando um log para debug
  console.log(
    `Buscando por "${query}" em ${cachedAssets.length} ativos cacheados.`,
  );

  const filteredAssets = cachedAssets
    .filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query),
    )
    .slice(0, 10);

  return NextResponse.json(filteredAssets);
}
