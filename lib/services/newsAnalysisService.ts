/* eslint-disable @typescript-eslint/no-explicit-any */
import { Asset } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Sentiment = "Positivo" | "Negativo" | "Neutro";

interface NewsEntity {
  name: string;
  type: "EMPRESA" | "CONCEITO" | "PESSOA" | "SETOR";
}

export interface NewsAnalysis {
  headline: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
  sentiment: Sentiment;
  impactedAssetSymbols: string[];
  entities: NewsEntity[];
  relationships: string[];
}

const newsApiKey = process.env.NEWS_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not configured in .env file");
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

const getSearchTermForAsset = (asset: Asset): string => {
  const customMappings: { [key: string]: string } = {
    MGLU3: "Magazine Luiza",
    PETR4: "Petrobras",
    ITSA4: "Itaúsa",
    BTC: "Bitcoin",
    ETH: "Ethereum",
  };
  return customMappings[asset.symbol.toUpperCase()] || asset.name;
};

/**
 * Analisa um único artigo de notícia usando o Gemini.
 * @param article - O artigo bruto da NewsAPI.
 * @param allAssets - A lista completa de ativos do usuário.
 * @returns A análise estruturada da notícia ou null em caso de falha.
 */

async function analyzeArticleWithGemini(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  article: any,
  allAssets: Asset[],
): Promise<NewsAnalysis | null> {
  const assetSymbols = allAssets.map((a) => a.symbol.toUpperCase());

  const prompt = `
    Analise o seguinte artigo de notícia e retorne um objeto JSON.

    Artigo:
    - Título: "${article.title}"
    - Conteúdo: "${article.description || article.content || ""}"

    Siga estritamente o seguinte formato JSON e preencha todos os campos:
    {
      "summary": "Um resumo conciso do artigo em português em no máximo 2 frases.",
      "sentiment": "O sentimento geral da notícia em relação ao mercado financeiro. Use apenas um dos seguintes valores: 'Positivo', 'Negativo' ou 'Neutro'.",
      "impactedAssetSymbols": ["Uma lista de tickers de ativos da lista [${assetSymbols.join(
        ", ",
      )}] que são diretamente ou indiretamente impactados por esta notícia. Se nenhum for impactado, retorne um array vazio."],
      "entities": [
        { "name": "Nome da entidade principal (empresa, conceito, pessoa)", "type": "Tipo da entidade (use EMPRESA, CONCEITO, PESSOA ou SETOR)" }
      ],
      "relationships": [
        "Descreva a principal relação ou evento em uma frase curta. Ex: 'Petrobras anuncia aumento de lucro de 10%'."
      ]
    }
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const jsonText = response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    const parsedJson = JSON.parse(jsonText);

    return {
      headline: article.title,
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
      ...parsedJson,
    };
  } catch (error) {
    console.error(
      `Error analyzing article with Gemini: ${article.title}`,
      error,
    );
    return null;
  }
}

/**
 * Busca e analisa notícias relevantes para a carteira de um usuário.
 * @param assets - A lista de ativos da carteira.
 * @returns Uma lista de análises de notícias.
 */
export async function fetchAndAnalyzeNews(
  assets: Asset[],
): Promise<NewsAnalysis[]> {
  if (!newsApiKey) {
    console.error("News API key is not configured.");
    return [];
  }

  const searchTerms = [...new Set(assets.map(getSearchTermForAsset))].slice(
    0,
    3,
  );
  const query = searchTerms.join(" OR ");
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=pt&sortBy=publishedAt&pageSize=5&apiKey=${newsApiKey}`;

  try {
    const newsResponse = await fetch(url);
    if (!newsResponse.ok) {
      console.error("Failed to fetch from NewsAPI:", newsResponse.statusText);
      return [];
    }
    const newsData = await newsResponse.json();

    // Analisa cada artigo com o Gemini em paralelo
    const analysisPromises = newsData.articles.map((article: unknown) =>
      analyzeArticleWithGemini(article, assets),
    );

    const analyses = await Promise.all(analysisPromises);

    // Filtra qualquer análise que tenha falhado (retornou null)
    return analyses.filter((a): a is NewsAnalysis => a !== null);
  } catch (error) {
    console.error("Error fetching or processing news:", error);
    return [];
  }
}
