"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
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
// FUNÇÃO INTERNA DE LÓGICA DE NEGÓCIO (CORRIGIDA)
// ===============================================

async function _recalculateAssetMetrics(assetId: string) {
  const transactions = await db.transaction.findMany({
    where: { assetId },
    orderBy: { date: "asc" },
  });

  let totalPurchaseQuantity = new Decimal(0);
  let totalPurchaseCost = new Decimal(0);
  let totalSellQuantity = new Decimal(0);

  for (const tx of transactions) {
    if (tx.type === TransactionType.COMPRA) {
      const transactionCost = tx.quantity.times(tx.unitPrice).plus(tx.fees);
      totalPurchaseCost = totalPurchaseCost.plus(transactionCost);
      totalPurchaseQuantity = totalPurchaseQuantity.plus(tx.quantity);
    } else if (tx.type === TransactionType.VENDA) {
      totalSellQuantity = totalSellQuantity.plus(tx.quantity);
    }
  }

  const currentQuantity = totalPurchaseQuantity.minus(totalSellQuantity);

  // Calcula o preço médio apenas com base nas compras para evitar distorções.
  // Se não houver compras, o preço médio é zero.
  const averagePrice =
    !totalPurchaseQuantity.isZero() && totalPurchaseQuantity.isPositive()
      ? totalPurchaseCost.dividedBy(totalPurchaseQuantity)
      : new Decimal(0);

  await db.asset.update({
    where: { id: assetId },
    data: {
      quantity: currentQuantity,
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

  // Garante que o usuário existe no nosso banco de dados.
  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: "", // Pode ser preenchido em outro momento
      name: "",
    },
  });

  // --- CORREÇÃO PRINCIPAL: BUSCA OU CRIA A CARTEIRA AQUI DENTRO ---
  let portfolio = await db.portfolio.findFirst({
    where: { userId: userId },
  });

  if (!portfolio) {
    portfolio = await db.portfolio.create({
      data: {
        name: "Carteira Principal",
        userId: userId,
      },
    });
  }
  // --- FIM DA CORREÇÃO ---

  const existingAsset = await db.asset.findUnique({
    where: {
      portfolioId_symbol: {
        portfolioId: portfolio.id, // Usa o ID da carteira encontrada/criada
        symbol: params.symbol,
      },
    },
  });

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

  const newAsset = await db.asset.create({
    data: {
      portfolioId: portfolio.id, // Usa o ID da carteira encontrada/criada
      symbol: params.symbol,
      type: params.type,
      quantity: 0,
      averagePrice: 0,
    },
  });

  return {
    ...newAsset,
    quantity: Number(newAsset.quantity),
    averagePrice: Number(newAsset.averagePrice),
    targetPrice: newAsset.targetPrice ? Number(newAsset.targetPrice) : null,
  };
};

async function sendWhatsappRequest(payload: object) {
  const { WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;

  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error(
      "As credenciais da API do WhatsApp não estão configuradas no .env",
    );
  }

  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Erro da API do WhatsApp:", errorData);
    throw new Error(
      `Falha ao enviar mensagem: ${errorData.error?.message || "Erro desconhecido"}`,
    );
  }

  return response.json();
}

// Função exportada para ser usada na API do Cron Job
export async function sendMonthlyNotification(
  to: string,
  name: string,
  month: string,
) {
  console.log(`Preparando notificação mensal para ${name} (${to})`);
  const payload = {
    messaging_product: "whatsapp",
    to: to.replace(/\D/g, ""),
    type: "template",
    template: {
      name: "monthly_tax_report", // O nome do seu template
      language: { code: "pt_BR" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: name },
            { type: "text", text: month },
          ],
        },
      ],
    },
  };
  await sendWhatsappRequest(payload);
  console.log(`Notificação para ${name} enviada com sucesso.`);
}

// ===============================================
// ACTION PARA ATIVAR NOTIFICAÇÕES
// ===============================================
const updateWhatsappInfoSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório."),
  phoneNumber: z.string().trim().min(1, "O número de telefone é obrigatório."),
});

export const updateUserWhatsappInfo = async (
  params: z.infer<typeof updateWhatsappInfoSchema>,
) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  const user = await clerkClient().users.getUser(userId);
  if (!user) throw new Error("Usuário não encontrado.");

  const { name, phoneNumber } = updateWhatsappInfoSchema.parse(params);

  await db.user.upsert({
    where: { id: userId },
    update: { name, phoneNumber, whatsappConsent: true },
    create: {
      id: userId,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      name,
      phoneNumber,
      whatsappConsent: true,
    },
  });

  // Envia a mensagem de teste usando a função genérica
  const testPayload = {
    messaging_product: "whatsapp",
    to: "5531996207676",
    type: "template",
    template: { name: "hello_world", language: { code: "en_US" } },
  };
  await sendWhatsappRequest(testPayload);

  revalidatePath("/notifications");
  return {
    success: true,
    message: "Informações salvas e mensagem de teste enviada!",
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
  const { ...dataForDb } = validatedParams;

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
