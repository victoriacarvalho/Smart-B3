import { NextResponse } from "next/server";

type CachedAsset = {
  symbol: string;
  name: string;
  type: "ACAO" | "FII" | "CRIPTO";
};

let cachedAssets: CachedAsset[] = [];
let lastFetchTimestamp = 0;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

async function populateAssetCache() {
  console.log("Iniciando a população do cache de ativos...");
  const allFetchedAssets: CachedAsset[] = [];

  try {
    const brapiResponse = await fetch("https://brapi.dev/api/quote/list");
    if (!brapiResponse.ok)
      throw new Error(
        `Brapi API responded with status ${brapiResponse.status}`,
      );

    const brapiData = await brapiResponse.json();
    brapiData.stocks.forEach((stock: { stock: string; name: string }) => {
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
    console.error("Falha ao buscar dados da Brapi:", error);
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

  const filteredAssets = cachedAssets
    .filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query),
    )
    .slice(0, 10);

  return NextResponse.json(filteredAssets);
}
