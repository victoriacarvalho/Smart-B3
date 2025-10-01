// app/api/portfolio/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma"; // Use a instância singleton do Prisma

/**
 * GET: Busca ou cria a carteira principal do usuário.
 * Se uma carteira não existir para o usuário logado, uma nova
 * "Carteira Principal" será criada automaticamente.
 */
export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // 1. Tenta encontrar a primeira carteira do usuário
    let portfolio = await db.portfolio.findFirst({
      where: { userId: userId },
      include: {
        assets: {
          orderBy: {
            symbol: "asc",
          },
        },
      },
    });

    // 2. Se não encontrar, cria uma carteira padrão para o usuário
    if (!portfolio) {
      console.log(
        `Nenhuma carteira encontrada para o userId: ${userId}. Criando uma nova.`,
      );
      portfolio = await db.portfolio.create({
        data: {
          name: "Carteira Principal",
          userId: userId,
        },
        include: {
          assets: true, // Inclui a lista de ativos, que estará vazia
        },
      });
    }

    // 3. Retorna a carteira (existente ou recém-criada) em um array
    // Manter o formato de array simplifica o código do frontend que espera uma lista.
    return NextResponse.json([portfolio]);
  } catch (error) {
    console.error("[API_PORTFOLIO_GET]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar ou criar a carteira." },
      { status: 500 },
    );
  }
}
