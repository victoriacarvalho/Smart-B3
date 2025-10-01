"use server";

import React from "react";
import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AssetType, TransactionType } from "@prisma/client";
import { DarfDocument } from "../_actions/DarfDocument";
import ReactPDF from "@react-pdf/renderer";
import fs from "fs/promises";
import path from "path";

// O tipo de retorno agora inclui a URL do relatório
type TaxResult = {
  tax: number;
  message: string;
  reportUrl: string | null;
};

export async function calculateTax(assetType: AssetType): Promise<TaxResult> {
  const { userId } = auth();
  if (!userId) redirect("/login");

  // --- ETAPA 1: LÓGICA DE CÁLCULO (EXISTENTE) ---
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const saleTransactions = await db.transaction.findMany({
    where: {
      type: TransactionType.VENDA,
      date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      asset: { type: assetType, portfolio: { userId: userId } },
    },
    include: { asset: true },
  });

  if (saleTransactions.length === 0) {
    return {
      tax: 0,
      message: "Nenhuma venda encontrada este mês.",
      reportUrl: null,
    };
  }

  let totalSales = 0;
  let totalProfit = 0;

  for (const tx of saleTransactions) {
    const saleValue = tx.quantity.toNumber() * tx.unitPrice.toNumber();
    const costValue = tx.quantity.toNumber() * tx.asset.averagePrice.toNumber();
    totalSales += saleValue;
    totalProfit += saleValue - costValue;
  }

  if (totalProfit <= 0) {
    return {
      tax: 0,
      message: `Você não teve lucro este mês.`,
      reportUrl: null,
    };
  }

  let tax = 0;
  let message = "";

  switch (assetType) {
    case AssetType.CRIPTO: {
      const exemptionLimit = 35000;
      if (totalSales >= exemptionLimit) {
        tax = totalProfit * 0.15;
        message = `Imposto de 15% sobre o lucro de R$ ${totalProfit.toFixed(2)}.`;
      } else {
        message = `Vendas de R$ ${totalSales.toFixed(2)} estão abaixo da isenção de R$ ${exemptionLimit}.`;
      }
      break;
    }
    case AssetType.ACAO: {
      const exemptionLimit = 20000;
      if (totalSales > exemptionLimit) {
        tax = totalProfit * 0.15; // Swing Trade
        message = `Imposto de 15% sobre o lucro de R$ ${totalProfit.toFixed(2)} (vendas acima de R$ ${exemptionLimit}).`;
      } else {
        message = `Vendas de R$ ${totalSales.toFixed(2)} não atingiram o limite para tributação.`;
      }
      break;
    }
    case AssetType.FII: {
      tax = totalProfit * 0.2;
      message = `Imposto de 20% sobre o lucro de R$ ${totalProfit.toFixed(2)}.`;
      break;
    }
    default:
      throw new Error("Tipo de ativo inválido.");
  }

  // --- ETAPA 2: DECISÃO E GERAÇÃO DE PDF ---

  // Se o imposto calculado for zero, retorne a mensagem sem gerar PDF
  if (tax <= 0) {
    return { tax: 0, message, reportUrl: null };
  }

  // Se houver imposto, colete os dados e gere o PDF
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
    codigoReceita: "6015", // Ganhos de Capital - Pessoa Física
  };

  const fileName = `DARF-${assetType}-${user.id}-${Date.now()}.pdf`;
  const reportsDir = path.join(process.cwd(), "public", "reports");
  const filePath = path.join(reportsDir, fileName);

  await fs.mkdir(reportsDir, { recursive: true });

  await ReactPDF.renderToFile(<DarfDocument {...darfData} />, filePath);

  const reportUrl = `/reports/${fileName}`;

  // Retorne sucesso com a URL para o frontend redirecionar
  return {
    tax,
    message: "DARF gerado com sucesso! Redirecionando...",
    reportUrl: reportUrl,
  };
}
