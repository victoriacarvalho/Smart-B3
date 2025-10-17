"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { fetchStockOrFiiPrice } from "@/lib/services/api/brapi";
import { fetchCryptoPrice } from "@/lib/services/api/coingecko";
import { AssetType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import axios from "axios";
import Sentiment from "sentiment";

const geminiApiKey = process.env.GEMINI_API_KEY;
const newsApiKey = process.env.NEWS_API_KEY;
const finnhubApiKey = process.env.FINNHUB_API_KEY;

if (!geminiApiKey)
  throw new Error("GEMINI_API_KEY não está configurada no .env");
if (!newsApiKey) throw new Error("NEWS_API_KEY não está configurada no .env");
if (!finnhubApiKey)
  throw new Error("FINNHUB_API_KEY não está configurada no .env");

const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Busca preços dos ativos (ações, FIIs e criptos)
 */
async function fetchAssetPrice(
  symbol: string,
  type: AssetType,
  apiId: string | null,
) {
  try {
    if (type === AssetType.ACAO || type === AssetType.FII) {
      const data = await fetchStockOrFiiPrice(symbol);
      return new Decimal(data?.price || 0);
    } else {
      const data = await fetchCryptoPrice(apiId || symbol);
      return new Decimal(data?.price || 0);
    }
  } catch (error) {
    console.error(`Falha ao buscar preço para ${symbol}:`, error);
    return new Decimal(0);
  }
}

/**
 * 🔹 Busca notícias na NewsAPI
 */
async function fetchNewsForAssets(assets: string[]) {
  const allNews: Record<string, any[]> = {};
  for (const symbol of assets) {
    try {
      const res = await axios.get("https://newsapi.org/v2/everything", {
        params: {
          q: symbol,
          language: "pt",
          sortBy: "relevancy",
          apiKey: newsApiKey,
          pageSize: 5,
        },
      });

      allNews[symbol] = res.data.articles.map((a: any) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        source: a.source?.name || "NewsAPI",
        publishedAt: a.publishedAt,
      }));
    } catch (error) {
      console.error(`Erro ao buscar notícias (NewsAPI) para ${symbol}:`, error);
      allNews[symbol] = [];
    }
  }
  return allNews;
}

/**
 * 🔹 Busca notícias na Finnhub
 */
async function fetchFinnhubNewsForAssets(assets: string[]) {
  const allNews: Record<string, any[]> = {};
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 15); // Últimos 15 dias

  for (const symbol of assets) {
    try {
      const res = await axios.get("https://finnhub.io/api/v1/company-news", {
        params: {
          symbol,
          from: from.toISOString().split("T")[0],
          to: to.toISOString().split("T")[0],
          token: finnhubApiKey,
        },
      });

      allNews[symbol] = Array.isArray(res.data)
        ? res.data.slice(0, 5).map((a: any) => ({
            title: a.headline,
            description: a.summary || "",
            url: a.url,
            source: a.source || "Finnhub",
            publishedAt: a.datetime
              ? new Date(a.datetime * 1000).toISOString()
              : new Date().toISOString(),
          }))
        : [];
    } catch (error) {
      console.error(`Erro ao buscar notícias (Finnhub) para ${symbol}:`, error);
      allNews[symbol] = [];
    }
  }

  return allNews;
}

/**
 * 🔹 Combina as duas fontes (NewsAPI + Finnhub)
 */
async function fetchCombinedNews(assets: string[]) {
  const [newsApiData, finnhubData] = await Promise.all([
    fetchNewsForAssets(assets),
    fetchFinnhubNewsForAssets(assets),
  ]);

  const combined: Record<string, any[]> = {};
  for (const symbol of assets) {
    combined[symbol] = [
      ...(newsApiData[symbol] || []),
      ...(finnhubData[symbol] || []),
    ];
  }
  return combined;
}

/**
 * 🔹 Análise de sentimento simples
 */
function analyzeSentiment(newsData: Record<string, any[]>) {
  const sentiment = new Sentiment();
  const results: Record<string, { average: number; samples: number }> = {};

  for (const [symbol, articles] of Object.entries(newsData)) {
    if (!articles.length) {
      results[symbol] = { average: 0, samples: 0 };
      continue;
    }

    const scores = articles.map(
      (a) => sentiment.analyze(`${a.title} ${a.description || ""}`).score,
    );
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    results[symbol] = { average: avg, samples: scores.length };
  }

  return results;
}

/**
 * 🔹 Geração de relatório de IA com dados reais e sentimento
 */
export const generateAiReportFromPortfolio = async (): Promise<
  string | null
> => {
  const { userId } = auth();
  if (!userId) throw new Error("Usuário não autenticado.");

  const userAssets = await db.asset.findMany({
    where: { portfolio: { userId }, quantity: { gt: 0 } },
  });

  if (userAssets.length === 0)
    return "Você ainda não possui ativos na carteira para gerar um relatório.";

  // 1️⃣ Buscar preços
  const prices = await Promise.all(
    userAssets.map((a) => fetchAssetPrice(a.symbol, a.type, a.apiId || null)),
  );

  // 2️⃣ Calcular totais
  let totalInvestedCost = new Decimal(0);
  let currentPortfolioValue = new Decimal(0);
  const assetDetails: string[] = [];

  userAssets.forEach((asset, i) => {
    const currentPrice = prices[i];
    const assetCurrentValue = asset.quantity.times(currentPrice);
    const assetInvestedCost = asset.quantity.times(asset.averagePrice);

    totalInvestedCost = totalInvestedCost.plus(assetInvestedCost);
    currentPortfolioValue = currentPortfolioValue.plus(assetCurrentValue);

    assetDetails.push(
      `- ${asset.symbol}: ${asset.quantity.toNumber()} unidades | Custo Médio R$ ${asset.averagePrice.toFixed(
        2,
      )} | Valor Atual R$ ${assetCurrentValue.toFixed(2)}`,
    );
  });

  const totalProfit = currentPortfolioValue.minus(totalInvestedCost);

  // 3️⃣ Buscar notícias combinadas
  const assetSymbols = userAssets.map((a) => a.symbol);
  const newsData = await fetchCombinedNews(assetSymbols);

  // 4️⃣ Análise de sentimento
  const sentimentData = analyzeSentiment(newsData);

  // 5️⃣ Formatar resumos
  const newsSummary = Object.entries(newsData)
    .map(([symbol, articles]) =>
      articles.length === 0
        ? `### ${symbol}\nNenhuma notícia encontrada.`
        : `### ${symbol}\n${articles
            .map(
              (a) =>
                `- [${a.title}](${a.url}) — ${a.source} (${new Date(
                  a.publishedAt,
                ).toLocaleDateString("pt-BR")})`,
            )
            .join("\n")}`,
    )
    .join("\n\n");

  const sentimentSummary = Object.entries(sentimentData)
    .map(
      ([symbol, s]) =>
        `- ${symbol}: Sentimento médio ${s.average.toFixed(
          2,
        )} (${s.samples} notícias analisadas)`,
    )
    .join("\n");

  // 6️⃣ Prompt da IA
  const prompt = `
Você é um analista financeiro especializado em **redes complexas e sentimento de mercado**.
Use os dados reais de notícias (NewsAPI + Finnhub) e sentimento fornecidos abaixo para gerar uma **análise de carteira** em formato Markdown.

**Dados da Carteira:**
- Valor Atual: R$ ${currentPortfolioValue.toFixed(2)}
- Custo Total: R$ ${totalInvestedCost.toFixed(2)}
- Lucro/Prejuízo: R$ ${totalProfit.toFixed(2)}
- Total de Ativos: ${userAssets.length}

**Ativos:**
${assetDetails.join("\n")}

**Sentimento Detectado:**
${sentimentSummary}

**Notícias Recentes (NewsAPI + Finnhub):**
${newsSummary}

Gere um relatório em Markdown com:
1. Análise geral e possíveis riscos sistêmicos.
2. Temas e conexões entre ativos (clusters de sentimento).
3. Sentimento agregado do portfólio.
4. Insights educacionais (sem recomendações financeiras).
`;

  // 7️⃣ Geração do relatório
  try {
    const result = await geminiModel.generateContent(prompt);
    return (await result.response).text();
  } catch (error) {
    console.error("Erro ao gerar relatório com Gemini:", error);
    return "Ocorreu um erro ao gerar o relatório de IA. Tente novamente mais tarde.";
  }
};
