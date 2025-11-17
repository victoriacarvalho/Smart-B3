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

async function recalculateMonthlyResults(
  userId: string,
  year: number,
  month: number,
) {
  console.log(`Recalculando resultados para ${userId} - ${month}/${year}`);

  await db.monthlyResult.deleteMany({
    where: { userId, year, month },
  });

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const sales = await db.transaction.findMany({
    where: {
      asset: { portfolio: { userId } },
      type: TransactionType.VENDA,
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    include: { asset: true },
  });

  if (sales.length === 0) {
    console.log(
      `Nenhuma venda encontrada para ${month}/${year}. Recálculo concluído.`,
    );
    revalidatePath("/");
    return;
  }

  const salesByAssetType = sales.reduce(
    (acc, sale) => {
      const { type } = sale.asset;
      if (!acc[type]) acc[type] = [];
      acc[type].push(sale);
      return acc;
    },
    {} as Record<AssetType, typeof sales>,
  );

  const newMonthlyResults = [];

  for (const assetTypeStr in salesByAssetType) {
    const assetType = assetTypeStr as AssetType;
    const assetSales = salesByAssetType[assetType];

    const { totalSold, netProfit } = assetSales.reduce(
      (acc, tx) => {
        const saleValue = tx.quantity.times(tx.unitPrice);
        const costOfSale = tx.quantity.times(tx.asset.averagePrice);
        const profit = saleValue.minus(costOfSale).minus(tx.fees);

        acc.totalSold = acc.totalSold.plus(saleValue);
        acc.netProfit = acc.netProfit.plus(profit);
        return acc;
      },
      { totalSold: new Decimal(0), netProfit: new Decimal(0) },
    );

    let taxDue = new Decimal(0);
    if (netProfit.isPositive()) {
      if (assetType === "ACAO" && totalSold.greaterThan(20000)) {
        taxDue = netProfit.times(0.15);
      } else if (assetType === "CRIPTO" && totalSold.greaterThan(35000)) {
        taxDue = netProfit.times(0.15);
      } else if (assetType === "FII") {
        taxDue = netProfit.times(0.2);
      }
    }

    newMonthlyResults.push({
      userId,
      year,
      month,
      assetType,
      operationType: OperationType.SWING_TRADE, // Simplificado
      totalSold,
      netProfit,
      taxDue,
      accumulatedLoss: new Decimal(0), // Placeholder
      taxBase: netProfit.isPositive() ? netProfit : new Decimal(0),
    });
  }

  if (newMonthlyResults.length > 0) {
    await db.monthlyResult.createMany({
      data: newMonthlyResults,
    });
    console.log(
      `${newMonthlyResults.length} resultados mensais salvos para ${month}/${year}.`,
    );
  }

  revalidatePath("/");
}

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

export const upsertTransaction = async (
  params: z.infer<typeof upsertTransactionSchema>,
) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  const validatedParams = upsertTransactionSchema.parse(params);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { assetType, ...dataForDb } = validatedParams;

  const asset = await db.asset.findUnique({
    where: { id: dataForDb.assetId },
    select: { portfolio: { select: { userId: true } } },
  });

  if (asset?.portfolio.userId !== userId) {
    throw new Error("Operação não permitida.");
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

  const transactionDate = data.date;
  await recalculateMonthlyResults(
    userId,
    transactionDate.getUTCFullYear(),
    transactionDate.getUTCMonth() + 1,
  );

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
      date: true,
      assetId: true,
      asset: { select: { portfolio: { select: { userId: true } } } },
    },
  });

  if (!transaction || transaction.asset.portfolio.userId !== userId) {
    throw new Error("Operação não permitida.");
  }

  const { assetId, date } = transaction;

  await db.transaction.delete({ where: { id } });

  await _recalculateAssetMetrics(assetId);

  await recalculateMonthlyResults(
    userId,
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
  );

  revalidatePath("/transactions");
  revalidatePath("/");
  return { success: true };
};

export const findOrCreateAsset = async (params: {
  symbol: string;
  type: AssetType;
}) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: "", name: "" },
  });

  let portfolio = await db.portfolio.findFirst({
    where: { userId: userId },
  });

  if (!portfolio) {
    portfolio = await db.portfolio.create({
      data: { name: "Carteira Principal", userId: userId },
    });
  }

  const existingAsset = await db.asset.findUnique({
    where: {
      portfolioId_symbol: {
        portfolioId: portfolio.id,
        symbol: params.symbol,
      },
    },
  });

  if (existingAsset) return existingAsset;

  return await db.asset.create({
    data: {
      portfolioId: portfolio.id,
      symbol: params.symbol,
      type: params.type,
      quantity: 0,
      averagePrice: 0,
    },
  });
};

async function sendWhatsappRequest(payload: object) {
  const { WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;

  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("Credenciais da API do WhatsApp não configuradas.");
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

export async function sendMonthlyNotification(
  to: string,
  name: string,
  month: string,
) {
  const payload = {
    messaging_product: "whatsapp",
    to: to.replace(/\D/g, ""),
    type: "template",
    template: {
      name: "monthly_tax_report",
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
}

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

  const today = new Date();
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const monthName = previousMonth.toLocaleString("pt-BR", {
    month: "long",
  });

  const testPayload = {
    messaging_product: "whatsapp",
    to: phoneNumber.replace(/\D/g, ""),
    type: "template",
    template: {
      name: "monthly_tax_report",
      language: { code: "pt_BR" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: name },
            { type: "text", text: monthName },
          ],
        },
      ],
    },
  };
  await sendWhatsappRequest(testPayload);

  revalidatePath("/notifications");
  return {
    success: true,
    message: "Informações salvas e mensagem enviada!",
  };
};
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
