"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
// CORREÇÃO: Importação corrigida para usar a instância singleton do Prisma.
import { db } from "@/app/_lib/prisma";
import {
  AssetType,
  TransactionType,
  OperationType,
  RetentionPeriod,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// ===============================================
// SCHEMAS DE VALIDAÇÃO (ZOD) - AGORA MAIS ROBUSTOS
// ===============================================

const idSchema = z.object({ id: z.string().cuid("ID inválido.") });

const upsertPortfolioSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1, "O nome da carteira é obrigatório."),
});

// MELHORIA: Schema com validação condicional para regras de negócio.
const upsertTransactionSchema = z
  .object({
    id: z.string().cuid().optional(),
    assetId: z.string().cuid(),
    assetType: z.nativeEnum(AssetType), // Campo auxiliar para validação
    type: z.nativeEnum(TransactionType),
    quantity: z.number().positive("A quantidade deve ser positiva."),
    unitPrice: z.number().positive("O preço unitário deve ser positivo."),
    fees: z.number().min(0).optional().default(0),
    date: z.date(),
    operationType: z.nativeEnum(OperationType).optional(),
    retentionPeriod: z.nativeEnum(RetentionPeriod).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.assetType === AssetType.ACAO ||
        data.assetType === AssetType.CRIPTO) &&
      !data.operationType
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O tipo de operação é obrigatório para Ações e Cripto.",
        path: ["operationType"],
      });
    }
    if (data.assetType === AssetType.FII && !data.retentionPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O prazo de retenção é obrigatório para FIIs.",
        path: ["retentionPeriod"],
      });
    }
  });

// ===============================================
// FUNÇÃO INTERNA DE LÓGICA DE NEGÓCIO
// ===============================================

/**
 * Recalcula a quantidade e o preço médio de um ativo com base em todas as suas transações.
 * Esta função é o coração do sistema e garante a precisão dos dados da carteira.
 * @param assetId O ID do ativo a ser recalculado.
 */
async function _recalculateAssetMetrics(assetId: string) {
  const transactions = await db.transaction.findMany({
    where: { assetId },
    orderBy: { date: "asc" },
  });

  let totalQuantity = new Decimal(0);
  let totalCost = new Decimal(0);

  for (const tx of transactions) {
    if (tx.type === TransactionType.COMPRA) {
      totalQuantity = totalQuantity.plus(tx.quantity);
      const transactionCost = tx.quantity.times(tx.unitPrice).plus(tx.fees);
      totalCost = totalCost.plus(transactionCost);
    } else if (tx.type === TransactionType.VENDA) {
      totalQuantity = totalQuantity.minus(tx.quantity);
      // O custo não é afetado na venda, pois o preço médio é baseado nas compras.
    }
  }

  // Previne divisão por zero se a quantidade for 0 ou negativa.
  const averagePrice = totalQuantity.isPositive()
    ? totalCost.dividedBy(totalQuantity)
    : new Decimal(0);

  await db.asset.update({
    where: { id: assetId },
    data: {
      quantity: totalQuantity,
      averagePrice: averagePrice,
    },
  });
}

// ===============================================
// ACTIONS: PORTFOLIO
// ===============================================

/**
 * Cria ou atualiza uma carteira para o usuário logado.
 */
export const upsertPortfolio = async (
  params: z.infer<typeof upsertPortfolioSchema>,
) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  const { id, name } = upsertPortfolioSchema.parse(params);

  // MELHORIA: Lógica separada para criar e atualizar, evitando erros no upsert.
  if (id) {
    await db.portfolio.update({
      where: { id, userId }, // Garante que o usuário só edite sua própria carteira
      data: { name },
    });
  } else {
    await db.portfolio.create({
      data: { name, userId },
    });
  }

  revalidatePath("/");
  return { success: true };
};

/**
 * Deleta uma carteira do usuário logado.
 */
export const deletePortfolio = async (params: z.infer<typeof idSchema>) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  const { id } = idSchema.parse(params);

  await db.portfolio.delete({
    where: { id, userId },
  });

  revalidatePath("/");
  return { success: true };
};

// ===============================================
// ACTIONS: ASSET
// ===============================================

/**
 * Encontra um ativo existente pelo símbolo ou cria um novo na carteira do usuário.
 * Melhora a UX, pois o usuário não precisa criar o ativo manualmente.
 */
export const findOrCreateAsset = async (params: {
  portfolioId: string;
  symbol: string;
  type: AssetType;
}) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  const portfolio = await db.portfolio.findUnique({
    where: { id: params.portfolioId },
  });
  if (portfolio?.userId !== userId) throw new Error("Carteira não encontrada.");

  const existingAsset = await db.asset.findUnique({
    where: {
      portfolioId_symbol: {
        portfolioId: params.portfolioId,
        symbol: params.symbol,
      },
    },
  });

  if (existingAsset) {
    return existingAsset;
  }

  const newAsset = await db.asset.create({
    data: {
      portfolioId: params.portfolioId,
      symbol: params.symbol,
      type: params.type,
      quantity: 0,
      averagePrice: 0,
    },
  });

  return newAsset;
};

// ===============================================
// ACTIONS: TRANSACTION
// ===============================================

/**
 * Cria ou atualiza uma transação e recalcula os dados do ativo.
 */
export const upsertTransaction = async (
  params: z.infer<typeof upsertTransactionSchema>,
) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  const validatedParams = upsertTransactionSchema.parse(params);

  // Desestrutura para remover o campo auxiliar `assetType`
  const { assetType, ...dataForDb } = validatedParams;

  const asset = await db.asset.findUnique({
    where: { id: dataForDb.assetId },
    select: { portfolio: { select: { userId: true } } },
  });

  if (asset?.portfolio.userId !== userId) {
    throw new Error(
      "Operação não permitida. O ativo não pertence a este usuário.",
    );
  }

  const data = {
    ...dataForDb,
    quantity: new Decimal(dataForDb.quantity),
    unitPrice: new Decimal(dataForDb.unitPrice),
    fees: new Decimal(dataForDb.fees),
  };

  await db.transaction.upsert({
    where: { id: data.id ?? "" },
    create: data,
    update: data,
  });

  // IMPLEMENTADO: Lógica de recálculo é chamada após cada alteração.
  await _recalculateAssetMetrics(data.assetId);

  revalidatePath("/transactions");
  revalidatePath("/");
  return { success: true };
};

/**
 * Deleta uma transação e recalcula os dados do ativo.
 */
export const deleteTransaction = async (params: z.infer<typeof idSchema>) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  const { id } = idSchema.parse(params);

  const transaction = await db.transaction.findUnique({
    where: { id },
    select: {
      assetId: true,
      asset: { select: { portfolio: { select: { userId: true } } } },
    },
  });

  if (!transaction || transaction.asset.portfolio.userId !== userId) {
    throw new Error("Operação não permitida.");
  }

  // Salva o ID do ativo antes de deletar a transação
  const { assetId } = transaction;

  await db.transaction.delete({
    where: { id },
  });

  // IMPLEMENTADO: Lógica de recálculo é chamada após a deleção.
  await _recalculateAssetMetrics(assetId);

  revalidatePath("/transactions");
  revalidatePath("/");
  return { success: true };
};
