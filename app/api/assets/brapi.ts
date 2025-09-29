// src/lib/services/api/brapi.ts
import { AssetPriceData } from "@/lib/types";

export async function fetchStockOrFiiPrice(
  symbol: string,
): Promise<AssetPriceData> {
  // Pega o token das variáveis de ambiente do servidor
  const token = process.env.BRAPI_API_TOKEN;

  // Constrói a URL base e adiciona o token se ele estiver definido
  let url = `https://brapi.dev/api/quote/${symbol.toUpperCase()}`;
  if (token) {
    url += `?token=${token}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Brapi API failed with status: ${response.status}`);
    }
    const data = await response.json();
    const result = data?.results?.[0];

    if (!result || !result.regularMarketPrice) {
      throw new Error(`Price for symbol ${symbol} not found in Brapi response`);
    }

    return {
      symbol: result.symbol,
      price: result.regularMarketPrice,
      source: "brapi",
    };
  } catch (error) {
    console.error("Error fetching from Brapi:", error);
    throw new Error("Failed to fetch stock/FII price from Brapi");
  }
}
