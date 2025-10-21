// app/calculation/_actions/calculates-taxes.tsx
"use server";

import React from "react";
import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AssetType, TransactionType } from "@prisma/client";
import ReactPDF from "@react-pdf/renderer";
import { put } from "@vercel/blob";
import { Prisma } from "@prisma/client";
import { DarfDocument } from "./darf-document";

type ActionResult = {
  success: boolean;
  message: string;
};

enum OperationType {
  ACAO_SWING = "ACAO_SWING",
  ACAO_DAYTRADE = "ACAO_DAYTRADE",
  FII = "FII",
  CRIPTO_BR = "CRIPTO_BR",
  CRIPTO_EXT = "CRIPTO_EXT",
}

export async function calculateTax(
  assetType: AssetType,
): Promise<ActionResult> {
  const { userId } = auth();
  if (!userId) redirect("/login");

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const saleTransactions = await db.transaction.findMany({
    where: {
      type: TransactionType.VENDA,
      date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      asset: { type: assetType, portfolio: { userId: userId } },
    },
    include: {
      asset: {
        select: {
          averagePrice: true,
          isForeign: true,
        },
      },
    },
  });

  if (saleTransactions.length === 0) {
    return { success: false, message: "Nenhuma venda encontrada este mês." };
  }

  let totalSalesBrazil = 0;
  let totalProfitBrazil_Swing = 0;
  let totalProfitBrazil_DayTrade = 0;
  let totalSalesForeign = 0;
  let totalProfitForeign = 0;

  for (const tx of saleTransactions) {
    const saleValue = tx.quantity.toNumber() * tx.unitPrice.toNumber();
    const costValue = tx.quantity.toNumber() * tx.asset.averagePrice.toNumber();
    const profit = saleValue - costValue;

    if (assetType === AssetType.CRIPTO && tx.asset.isForeign) {
      totalSalesForeign += saleValue;
      totalProfitForeign += profit;
    } else if (assetType === AssetType.ACAO && tx.isDayTrade) {
      totalProfitBrazil_DayTrade += profit;
    } else {
      totalSalesBrazil += saleValue;
      totalProfitBrazil_Swing += profit;
    }
  }

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth(), 0);
  const prevMonth = prevMonthDate.getMonth() + 1;
  const prevYear = prevMonthDate.getFullYear();

  const findPreviousLoss = async (
    operationType: OperationType,
  ): Promise<number> => {
    const loss = await db.accumulatedLoss.findUnique({
      where: {
        userId_year_month_operationType: {
          userId: userId,
          year: prevYear,
          month: prevMonth,
          operationType: operationType,
        },
      },
    });
    return loss ? loss.amount.toNumber() : 0;
  };

  const storeNewLoss = async (operationType: OperationType, amount: number) => {
    const newLossAmount = Math.min(amount, 0);

    await db.accumulatedLoss.upsert({
      where: {
        userId_year_month_operationType: {
          userId: userId,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          operationType: operationType,
        },
      },
      create: {
        userId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        operationType,
        amount: newLossAmount,
      },
      update: {
        amount: newLossAmount,
      },
    });
  };

  let tax = 0;
  let codigoReceita = "";

  switch (assetType) {
    case AssetType.CRIPTO: {
      let taxBrazil = 0;
      let taxForeign = 0;

      const prevLossBR = await findPreviousLoss(OperationType.CRIPTO_BR);
      const netProfitBR = totalProfitBrazil_Swing + prevLossBR;

      if (netProfitBR > 0) {
        if (totalSalesBrazil > 35000) {
          taxBrazil = netProfitBR * 0.15;
        }
        await storeNewLoss(OperationType.CRIPTO_BR, 0);
      } else {
        await storeNewLoss(OperationType.CRIPTO_BR, netProfitBR);
      }

      const prevLossEXT = await findPreviousLoss(OperationType.CRIPTO_EXT);
      const netProfitEXT = totalProfitForeign + prevLossEXT;

      if (netProfitEXT > 0) {
        taxForeign = netProfitEXT * 0.15;
        await storeNewLoss(OperationType.CRIPTO_EXT, 0);
      } else {
        await storeNewLoss(OperationType.CRIPTO_EXT, netProfitEXT);
      }

      if (taxBrazil > 0 && taxForeign > 0) {
        return {
          success: false,
          message:
            "Imposto devido em Cripto Nacional (Cód. 4600) e Exterior (Cód. 1889). Você deve gerar DARFs separados.",
        };
      }

      if (taxForeign > 0) {
        tax = taxForeign;
        codigoReceita = "1889";
      } else if (taxBrazil > 0) {
        tax = taxBrazil;
        codigoReceita = "4600";
      }
      break;
    }

    case AssetType.ACAO: {
      let taxDayTrade = 0;
      let taxSwingTrade = 0;

      const prevLossDT = await findPreviousLoss(OperationType.ACAO_DAYTRADE);
      const netProfitDT = totalProfitBrazil_DayTrade + prevLossDT;

      if (netProfitDT > 0) {
        taxDayTrade = netProfitDT * 0.2;
        await storeNewLoss(OperationType.ACAO_DAYTRADE, 0);
      } else {
        await storeNewLoss(OperationType.ACAO_DAYTRADE, netProfitDT);
      }

      const prevLossST = await findPreviousLoss(OperationType.ACAO_SWING);
      const netProfitST = totalProfitBrazil_Swing + prevLossST;

      if (netProfitST > 0) {
        if (totalSalesBrazil > 20000) {
          taxSwingTrade = netProfitST * 0.15;
        }
        await storeNewLoss(OperationType.ACAO_SWING, 0);
      } else {
        await storeNewLoss(OperationType.ACAO_SWING, netProfitST);
      }

      tax = taxDayTrade + taxSwingTrade;
      if (tax > 0) {
        codigoReceita = "6015";
      }
      break;
    }

    case AssetType.FII: {
      const prevLossFII = await findPreviousLoss(OperationType.FII);
      const netProfitFII = totalProfitBrazil_Swing + prevLossFII;

      if (netProfitFII > 0) {
        tax = netProfitFII * 0.2;
        await storeNewLoss(OperationType.FII, 0);
      } else {
        await storeNewLoss(OperationType.FII, netProfitFII);
      }

      if (tax > 0) {
        codigoReceita = "6015";
      }
      break;
    }
  }

  if (tax <= 0) {
    return {
      success: false,
      message:
        "Nenhum imposto devido. Você está dentro do limite de isenção ou seus lucros foram compensados por prejuízos.",
    };
  }

  if (!codigoReceita) {
    return {
      success: false,
      message: "Erro interno: Código da receita não definido.",
    };
  }

  const user = await clerkClient().users.getUser(userId);
  const apuracao = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  const vencimento = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  const darfData = {
    userName:
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Contribuinte",
    userCpf: (user.privateMetadata?.cpf as string) ?? "CPF não informado",
    apuracao,
    vencimento: vencimento.toLocaleDateString("pt-BR"),
    valorPrincipal: tax.toFixed(2).replace(".", ","),
    codigoReceita: codigoReceita,
  };

  const fileName = `DARF-${codigoReceita}-${user.id}-${Date.now()}.pdf`;

  try {
    const pdfStream = await ReactPDF.renderToStream(
      <DarfDocument {...darfData} />,
    );

    const blob = await put(fileName, pdfStream, {
      access: "public",
      contentType: "application/pdf",
    });

    const dataToSave = {
      userId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      assetType,
      taxDue: new Prisma.Decimal(tax),
      pdfUrl: blob.url,
      codigoReceita: codigoReceita,
    };

    await db.darf.upsert({
      where: {
        userId_year_month_assetType: {
          userId,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          assetType,
        },
      },
      update: dataToSave,
      create: dataToSave,
    });
  } catch (error) {
    console.error("ERRO AO GERAR/SALVAR DARF:", error);
    return { success: false, message: "Falha ao gerar e salvar o PDF." };
  }

  return {
    success: true,
    message: `DARF (Cód. ${codigoReceita}) gerado e salvo com sucesso!`,
  };
}
