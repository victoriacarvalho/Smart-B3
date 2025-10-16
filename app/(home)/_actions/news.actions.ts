"use server";

import { db } from "@/app/_lib/prisma";
import { fetchAndAnalyzeNews } from "@/lib/services/newsAnalysisService";
import { auth } from "@clerk/nextjs/server";

/**
 * Server Action para buscar, analisar e retornar notícias
 * relevantes para a carteira do usuário logado.
 */
export const getNewsAnalysisForPortfolio = async () => {
  // 1. Garante que o usuário está autenticado
  const { userId } = auth();
  if (!userId) {
    // Em um cenário real, o middleware já bloquearia, mas é uma boa prática verificar.
    throw new Error("Usuário não autenticado.");
  }

  // 2. Busca os ativos que o usuário realmente possui em carteira
  const userAssets = await db.asset.findMany({
    where: {
      portfolio: { userId },
      quantity: {
        gt: 0, // 'gt: 0' significa "greater than 0"
      },
    },
  });

  // Se o usuário não tiver ativos, não há o que analisar.
  if (userAssets.length === 0) {
    return [];
  }

  // 3. Chama o serviço principal para fazer o trabalho pesado
  const analysisResults = await fetchAndAnalyzeNews(userAssets);

  // 4. Retorna os resultados para o frontend
  return analysisResults;
};
