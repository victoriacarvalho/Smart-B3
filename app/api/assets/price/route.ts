// app/api/assets/price/route.ts
import { NextResponse } from "next/server";
import { AssetType } from "@prisma/client";
import { fetchStockOrFiiPrice } from "@/lib/services/api/brapi"; // Caminho atualizado
import { fetchCryptoPrice } from "@/lib/services/api/coingecko"; // Caminho atualizado
import { AssetPriceData } from "@/lib/types";

// CACHE EM MEMÓRIA CENTRALIZADO
const cache = new Map<string, { data: AssetPriceData; timestamp: number }>();
const CACHE_TTL_SECONDS = 2 * 60; // Cache de 2 minutos

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol"); // Pode ser ticker (PETR4) ou apiId (bitcoin)
  const type = searchParams.get("type") as AssetType;

  if (!symbol || !type) {
    return NextResponse.json(
      { error: "O símbolo e o tipo do ativo são obrigatórios." },
      { status: 400 },
    );
  }

  const cacheKey = `${type}_${symbol.toUpperCase()}`;
  const cachedItem = cache.get(cacheKey);

  // 1. Verifica o cache primeiro
  if (
    cachedItem &&
    (Date.now() - cachedItem.timestamp) / 1000 < CACHE_TTL_SECONDS
  ) {
    console.log(`CACHE HIT for ${cacheKey}`);
    return NextResponse.json(cachedItem.data);
  }

  console.log(`CACHE MISS for ${cacheKey}`);

  try {
    let priceData: AssetPriceData | null = null;

    if (type === "CRIPTO") {
      // Para cripto, o 'symbol' que recebemos é o apiId
      priceData = await fetchCryptoPrice(symbol);
    } else if (type === "ACAO" || type === "FII") {
      priceData = await fetchStockOrFiiPrice(symbol);
    } else {
      return NextResponse.json(
        { error: `Tipo de ativo não suportado: ${type}` },
        { status: 400 },
      );
    }

    if (!priceData) {
      throw new Error(`Preço não encontrado para ${symbol}`);
    }

    // 2. Salva no cache em caso de sucesso
    cache.set(cacheKey, { data: priceData, timestamp: Date.now() });

    return NextResponse.json(priceData);
  } catch (error: any) {
    console.error(
      `Erro ao buscar preço para ${symbol} (${type}):`,
      error.message,
    );
    return NextResponse.json(
      { error: `Não foi possível obter o preço para ${symbol}.` },
      { status: 404 },
    );
  }
}
