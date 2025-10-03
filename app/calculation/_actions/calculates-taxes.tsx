// app/calculation/_actions/calculates-taxes.tsx
"use server";

import React from "react";
import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AssetType, TransactionType } from "@prisma/client";
import { DarfDocument } from "../_actions/DarfDocument";
import ReactPDF from "@react-pdf/renderer";
import { put } from "@vercel/blob"; // Importa a função do Vercel Blob

type ActionResult = {
  success: boolean;
  message: string;
};

export async function calculateTax(
  assetType: AssetType,
): Promise<ActionResult> {
  const { userId } = auth();
  if (!userId) redirect("/login");

  // --- ETAPA 1: LÓGICA DE CÁLCULO (Sua lógica, mantida) ---
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
    return { success: false, message: "Nenhuma venda encontrada este mês." };
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
    return { success: false, message: `Você não teve lucro este mês.` };
  }

  let tax = 0;
  switch (assetType) {
    case AssetType.CRIPTO:
      if (totalSales >= 35000) tax = totalProfit * 0.15;
      break;
    case AssetType.ACAO:
      if (totalSales > 20000) tax = totalProfit * 0.15;
      break;
    case AssetType.FII:
      tax = totalProfit * 0.2;
      break;
  }

  if (tax <= 0) {
    return {
      success: false,
      message: "Suas operações estão dentro do limite de isenção.",
    };
  }

  // --- ETAPA 2: GERAÇÃO DE PDF E UPLOAD PARA O BLOB ---
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
    codigoReceita: "6015",
  };

  const fileName = `DARF-${assetType}-${user.id}-${Date.now()}.pdf`;

  try {
    // Gera o PDF em memória (como um buffer/stream)
    const pdfStream = await ReactPDF.renderToStream(
      <DarfDocument {...darfData} />,
    );

    // Faz o upload do stream para o Vercel Blob
    const blob = await put(fileName, pdfStream, {
      access: "public",
      contentType: "application/pdf",
    });

    // Salva a URL retornada pelo Vercel Blob no banco de dados
    const dataToSave = {
      userId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      assetType,
      taxDue: tax,
      pdfUrl: blob.url, // Usa a URL do Blob
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
    message: "DARF gerado e salvo com sucesso!",
  };
}
