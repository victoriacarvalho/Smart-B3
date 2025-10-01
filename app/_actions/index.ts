"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import {
  AssetType,
  TransactionType,
  OperationType,
  RetentionPeriod,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// ===============================================
// SCHEMAS DE VALIDAÇÃO (ZOD)
// ===============================================

const idSchema = z.object({ id: z.string().cuid("ID inválido.") });

const upsertPortfolioSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1, "O nome da carteira é obrigatório."),
});

const upsertTransactionSchema = z
  .object({
    id: z.string().cuid().optional(),
    assetId: z.string().cuid(),
    assetType: z.nativeEnum(AssetType),
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

async function _recalculateAssetMetrics(assetId: string) {
  const transactions = await db.transaction.findMany({
    where: { assetId },
    orderBy: { date: "asc" },
  });

  let totalQuantity = new Decimal(0);
  let totalCost = new Decimal(0);

  for (const tx of transactions) {
    if (tx.type === TransactionType.COMPRA) {
      const transactionCost = tx.quantity.times(tx.unitPrice).plus(tx.fees);
      totalCost = totalCost.plus(transactionCost);
      totalQuantity = totalQuantity.plus(tx.quantity);
    } else if (tx.type === TransactionType.VENDA) {
      totalQuantity = totalQuantity.minus(tx.quantity);
    }
  }

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

export const upsertPortfolio = async (
  params: z.infer<typeof upsertPortfolioSchema>,
) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  const { id, name } = upsertPortfolioSchema.parse(params);

  if (id) {
    await db.portfolio.update({ where: { id, userId }, data: { name } });
  } else {
    await db.portfolio.create({ data: { name, userId } });
  }

  revalidatePath("/");
  return { success: true };
};

export const deletePortfolio = async (params: z.infer<typeof idSchema>) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  const { id } = idSchema.parse(params);

  await db.portfolio.delete({ where: { id, userId } });

  revalidatePath("/");
  return { success: true };
};

// ===============================================
// ACTIONS: ASSET
// ===============================================

export const findOrCreateAsset = async (params: {
  symbol: string;
  type: AssetType;
}) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  // 1. Garante que o utilizador existe no nosso banco de dados.
  await db.user.upsert({
    where: { id: userId },
    update: {}, // Não é necessário atualizar
    create: {
      id: userId,
      email: "", // Clerk gere o email, podemos deixar vazio aqui
      name: "", // Clerk gere o nome, podemos deixar vazio aqui
    },
  });

  // 2. Procura pela carteira do utilizador.
  let portfolio = await db.portfolio.findFirst({
    where: { userId: userId },
    orderBy: { createdAt: "asc" },
  });

  // 3. Se a carteira não existir, cria uma.
  if (!portfolio) {
    portfolio = await db.portfolio.create({
      data: {
        userId: userId,
        name: "Carteira Principal",
      },
    });
  }

  const portfolioId = portfolio.id;

  // 4. Procura pelo ativo dentro da carteira.
  const existingAsset = await db.asset.findUnique({
    where: {
      portfolioId_symbol: {
        portfolioId: portfolioId,
        symbol: params.symbol,
      },
    },
  });

  // 5. Se o ativo existir, converte os campos Decimal para number e retorna.
  if (existingAsset) {
    return {
      ...existingAsset,
      quantity: Number(existingAsset.quantity),
      averagePrice: Number(existingAsset.averagePrice),
      targetPrice: existingAsset.targetPrice
        ? Number(existingAsset.targetPrice)
        : null,
    };
  }

  // 6. Se o ativo não existir, cria um novo.
  const newAsset = await db.asset.create({
    data: {
      portfolioId: portfolioId,
      symbol: params.symbol,
      type: params.type,
      quantity: 0,
      averagePrice: 0,
    },
  });

  // 7. Converte os campos Decimal para number antes de retornar.
  return {
    ...newAsset,
    quantity: Number(newAsset.quantity),
    averagePrice: Number(newAsset.averagePrice),
    targetPrice: newAsset.targetPrice ? Number(newAsset.targetPrice) : null,
  };
};

// ===============================================
// ACTIONS: TRANSACTION
// ===============================================

export const upsertTransaction = async (
  params: z.infer<typeof upsertTransactionSchema>,
) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  const validatedParams = upsertTransactionSchema.parse(params);
  const { assetType, ...dataForDb } = validatedParams;

  const asset = await db.asset.findUnique({
    where: { id: dataForDb.assetId },
    select: { portfolio: { select: { userId: true } } },
  });

  if (asset?.portfolio.userId !== userId) {
    throw new Error(
      "Operação não permitida. O ativo não pertence a este utilizador.",
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

  await _recalculateAssetMetrics(data.assetId);

  revalidatePath("/transactions");
  revalidatePath("/");
  return { success: true };
};

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

  const { assetId } = transaction;

  await db.transaction.delete({
    where: { id },
  });

  await _recalculateAssetMetrics(assetId);

  revalidatePath("/transactions");
  revalidatePath("/");
  return { success: true };
};
