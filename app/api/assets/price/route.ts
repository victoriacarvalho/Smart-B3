// app/api/assets/price/route.ts
import { NextResponse } from "next/server";
import { AssetType } from "@prisma/client";
import { fetchStockOrFiiPrice } from "@/lib/services/api/brapi";
import { fetchCryptoPrice } from "@/lib/services/api/coingecko";
import { AssetPriceData } from "@/lib/types";

const cache = new Map<string, { data: AssetPriceData; timestamp: number }>();
const CACHE_TTL_SECONDS = 2 * 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const type = searchParams.get("type") as AssetType;

  if (!symbol || !type) {
    return NextResponse.json(
      { error: "O símbolo e o tipo do ativo são obrigatórios." },
      { status: 400 },
    );
  }

  const cacheKey = `${type}_${symbol.toUpperCase()}`;
  const cachedItem = cache.get(cacheKey);

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

    cache.set(cacheKey, { data: priceData, timestamp: Date.now() });

    return NextResponse.json(priceData);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
