import axios from "axios";
import cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Asset } from "@prisma/client";

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!NEWS_API_KEY) throw new Error("NEWS_API_KEY is not configured");
if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export type Sentiment = "Positivo" | "Negativo" | "Neutro";

export interface NewsEntity {
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

const customMappings: Record<string, string> = {
  MGLU3: "Magazine Luiza",
  PETR4: "Petrobras",
  ITSA4: "Itaúsa",
  BTC: "Bitcoin",
  ETH: "Ethereum",
};

function getSearchTermForAsset(asset: Asset): string {
  return customMappings[asset.symbol.toUpperCase()] || asset.name;
}

/**
 * Scraping simples para buscar texto extra do artigo.
 */
export async function scrapeArticleText(url: string): Promise<string | null> {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const paragraphs = $("p")
      .map((_, el) => $(el).text())
      .get();
    return paragraphs.join(" ");
  } catch (err) {
    console.warn(`Failed to scrape article text for ${url}`, err);
    return null;
  }
}

/**
 * Busca notícias na NewsAPI por múltiplos termos
 */
export async function fetchNewsFromNewsAPI(assets: Asset[]) {
  const terms = [...new Set(assets.map(getSearchTermForAsset))].slice(0, 3);
  const query = terms.join(" OR ");

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=pt&pageSize=5&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;

  try {
    const res = await axios.get(url);
    return res.data.articles || [];
  } catch (error) {
    console.error("Error fetching news from NewsAPI:", error);
    return [];
  }
}

/**
 * Usa Gemini para analisar artigo e extrair entidades, sentimento, etc.
 */
export async function analyzeArticleWithGemini(
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
  "impactedAssetSymbols": ["Uma lista de tickers de ativos da lista [${assetSymbols.join(", ")}] que são diretamente ou indiretamente impactados por esta notícia. Se nenhum for impactado, retorne um array vazio."],
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

    const parsed = JSON.parse(jsonText);

    return {
      headline: article.title,
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
      ...parsed,
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
 * Função principal: busca notícias e faz análises com Gemini
 */
export async function fetchAndAnalyzeNews(
  assets: Asset[],
): Promise<NewsAnalysis[]> {
  const rawArticles = await fetchNewsFromNewsAPI(assets);

  // Adicionar scraping do conteúdo para melhorar análise (opcional)
  for (const article of rawArticles) {
    if (!article.content) {
      article.content = await scrapeArticleText(article.url);
    }
  }

  // Analisar com Gemini em paralelo
  const analyses = await Promise.all(
    rawArticles.map((article) => analyzeArticleWithGemini(article, assets)),
  );

  return analyses.filter((a): a is NewsAnalysis => a !== null);
}
