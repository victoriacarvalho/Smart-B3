"use server";

import React from "react";
import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AssetType, TransactionType, Prisma } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import { put, del } from "@vercel/blob";
import { DarfDocument } from "./darf-document";
import { UnifiedDarfDocument } from "./unified-darf-document";

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

async function _calculateTaxForType(
  userId: string,
  assetType: AssetType,
  now: Date,
) {
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
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
    return {
      tax: new Prisma.Decimal(0),
      codigoReceita: "",
      valorPrincipal: "0,00",
      message: "Nenhuma venda encontrada este mês.",
    };
  }

  let totalSalesBrazil = 0;
  let totalProfitBrazil_Swing = 0;
  let totalProfitBrazil_DayTrade = 0;
  let totalProfitForeign = 0;
  
  let totalIrrf = 0; 

  for (const tx of saleTransactions) {
    const saleValue = tx.quantity.toNumber() * tx.unitPrice.toNumber();
    const costValue = tx.quantity.toNumber() * tx.asset.averagePrice.toNumber();
    const profit = saleValue - costValue;

    if (assetType === AssetType.CRIPTO && tx.asset.isForeign) {
      totalProfitForeign += profit;
    } else if (assetType === AssetType.ACAO && tx.isDayTrade) {
      totalProfitBrazil_DayTrade += profit;
      if (profit > 0) totalIrrf += profit * 0.01; 
    } else {
      totalSalesBrazil += saleValue;
      totalProfitBrazil_Swing += profit;
      
      if (assetType === AssetType.ACAO) {
        totalIrrf += saleValue * 0.00005; // 0,005% sobre o valor da alienação
      } else if (assetType === AssetType.FII) {
        if (tx.isDayTrade && profit > 0) {
          totalIrrf += profit * 0.01; // Day Trade em FII também é 1% sobre o lucro
        } else if (!tx.isDayTrade) {
          totalIrrf += saleValue * 0.00005; // Comum em FII é 0,005% sobre alienação
        }
      }
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
  let message = "Cálculo bem-sucedido.";

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

      tax = taxBrazil + taxForeign;

      if (tax > 0) {
        if (taxBrazil > 0 && taxForeign > 0) {
          codigoReceita = "4600 / IRPF (AAI)";
        } else if (taxBrazil > 0) {
          codigoReceita = "4600";
        } else {
          codigoReceita = "IRPF (AAI)";
        }
      }

      if (taxForeign > 0) {
        message += ` Nota: O valor inclui R$ ${taxForeign.toFixed(2)} referente ao Exterior (Declarar no Ajuste Anual).`;
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
        tax = Math.max(0, tax - totalIrrf);
        if (tax > 0) codigoReceita = "6015";
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

      // CORREÇÃO: Desconto do IRRF antes da finalização
      if (tax > 0) {
        tax = Math.max(0, tax - totalIrrf);
        if (tax > 0) codigoReceita = "6015";
      }
      break;
    }
  }

  if (tax <= 0) {
    let detalhe = "Nenhum imposto devido.";

    if (totalIrrf > 0 && message === "Cálculo bem-sucedido.") {
      detalhe = "Imposto retido na fonte (Dedo-duro) cobriu o valor devido ou não houve lucro tributável.";
    } else if (assetType === AssetType.CRIPTO) {
      if (totalProfitForeign > 0) {
        detalhe = "Lucro no Exterior compensado por prejuízos anteriores.";
      } else if (totalSalesBrazil > 0 && totalSalesBrazil <= 35000) {
        detalhe = `Isento: Vendas Nacionais (R$ ${totalSalesBrazil.toLocaleString("pt-BR")}) abaixo de 35k.`;
      } else if (totalSalesBrazil === 0 && totalProfitForeign === 0) {
        detalhe = "Não foram detectados lucros tributáveis (Verifique se o ativo está marcado como 'Estrangeira').";
      }
    }

    return {
      tax: new Prisma.Decimal(0),
      codigoReceita: "",
      valorPrincipal: "0,00",
      message: detalhe,
    };
  }

  return {
    tax: new Prisma.Decimal(tax),
    codigoReceita: codigoReceita,
    valorPrincipal: tax.toFixed(2).replace(".", ","),
    message: message,
  };
}

async function _generateOrUpdateUnifiedDarf(
  userId: string,
  year: number,
  month: number,
) {
  const individualDarfs = await db.darf.findMany({
    where: {
      userId,
      year,
      month,
      assetType: { in: [AssetType.ACAO, AssetType.FII, AssetType.CRIPTO] },
    },
  });

  let totalTax = new Prisma.Decimal(0);
  let acaoData = null;
  let fiiData = null;
  let criptoData = null;
  const apuracao = `${String(month).padStart(2, "0")}/${year}`;

  for (const darf of individualDarfs) {
    totalTax = totalTax.plus(darf.taxDue);
    const darfInfo = {
      apuracao: apuracao,
      valorPrincipal: darf.taxDue.toFixed(2).replace(".", ","),
      codigoReceita: darf.codigoReceita || "N/A",
      nota:
        darf.assetType === AssetType.CRIPTO &&
        darf.codigoReceita?.includes("AAI")
          ? "Nota: Contém valores referentes a aplicações no Exterior (AAI)."
          : undefined,
    };

    if (darf.assetType === AssetType.ACAO) acaoData = darfInfo;
    if (darf.assetType === AssetType.FII) fiiData = darfInfo;
    if (darf.assetType === AssetType.CRIPTO) criptoData = darfInfo;
  }

  if (totalTax.lessThanOrEqualTo(0)) {
    const oldUnified = await db.darf.findUnique({
      where: {
        userId_year_month_assetType: {
          userId,
          year,
          month,
          assetType: AssetType.UNIFICADA,
        },
      },
    });
    if (oldUnified) {
      await del(oldUnified.pdfUrl);
      await db.darf.delete({ where: { id: oldUnified.id } });
    }
    return;
  }

  const user = await clerkClient().users.getUser(userId);
  const userName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Contribuinte";

  const pdfBuffer = await renderToBuffer(
    <UnifiedDarfDocument
      userName={userName}
      apuracao={apuracao}
      acaoData={acaoData}
      fiiData={fiiData}
      criptoData={criptoData}
      valorTotal={totalTax.toFixed(2).replace(".", ",")}
    />,
  );

  const existingUnifiedDarf = await db.darf.findUnique({
    where: {
      userId_year_month_assetType: {
        userId,
        year,
        month,
        assetType: AssetType.UNIFICADA,
      },
    },
    select: { pdfUrl: true },
  });

  if (existingUnifiedDarf) {
    try {
      await del(existingUnifiedDarf.pdfUrl);
    } catch (error) {
      console.warn(
        "Falha ao deletar blob antigo (pode já ter sido limpo):",
        error,
      );
    }
  }

  const fileName = `DARF-UNIFICADA-${userId}-${year}-${month}.pdf`;
  const blob = await put(fileName, pdfBuffer, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: true,
  });

  await db.darf.upsert({
    where: {
      userId_year_month_assetType: {
        userId,
        year,
        month,
        assetType: AssetType.UNIFICADA,
      },
    },
    create: {
      userId,
      month,
      year,
      assetType: AssetType.UNIFICADA,
      taxDue: totalTax,
      pdfUrl: blob.url,
      codigoReceita: "UNIFICADO",
    },
    update: {
      taxDue: totalTax,
      pdfUrl: blob.url,
    },
  });

  console.log(`DARF Unificada atualizada para ${userId} - ${month}/${year}`);
}

export async function calculateTax(
  assetType: AssetType,
): Promise<ActionResult> {
  const { userId } = auth();
  if (!userId) redirect("/login");

  const now = new Date();
  const user = await clerkClient().users.getUser(userId);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const calcResult = await _calculateTaxForType(userId, assetType, now);

  if (calcResult.tax.lessThanOrEqualTo(0)) {
    const existingDarf = await db.darf.findUnique({
      where: {
        userId_year_month_assetType: { userId, year, month, assetType },
      },
    });
    if (existingDarf) {
      await del(existingDarf.pdfUrl);
      await db.darf.delete({ where: { id: existingDarf.id } });
    }
    await _generateOrUpdateUnifiedDarf(userId, year, month);
    return { success: false, message: calcResult.message };
  }

  const apuracao = `${String(month).padStart(2, "0")}/${year}`;
  const vencimento = new Date(year, month + 1, 0);

  const darfData = {
    userName:
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Contribuinte",
    userCpf: (user.privateMetadata?.cpf as string) ?? "CPF não informado",
    apuracao,
    vencimento: vencimento.toLocaleDateString("pt-BR"),
    valorPrincipal: calcResult.valorPrincipal,
    codigoReceita: calcResult.codigoReceita,
    observacoes:
      calcResult.message !== "Cálculo bem-sucedido."
        ? calcResult.message
        : undefined,
  };

  const fileName = `DARF-${assetType}-${calcResult.codigoReceita}-${userId}.pdf`;

  try {
    const pdfBuffer = await renderToBuffer(<DarfDocument {...darfData} />);

    const existingDarf = await db.darf.findUnique({
      where: {
        userId_year_month_assetType: { userId, year, month, assetType },
      },
      select: { pdfUrl: true },
    });
    if (existingDarf) {
      await del(existingDarf.pdfUrl);
    }

    const blob = await put(fileName, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: true,
    });

    await db.darf.upsert({
      where: {
        userId_year_month_assetType: { userId, year, month, assetType },
      },
      create: {
        userId,
        month,
        year,
        assetType,
        taxDue: calcResult.tax,
        pdfUrl: blob.url,
        codigoReceita: calcResult.codigoReceita,
      },
      update: {
        taxDue: calcResult.tax,
        pdfUrl: blob.url,
        codigoReceita: calcResult.codigoReceita,
      },
    });

    await _generateOrUpdateUnifiedDarf(userId, year, month);
  } catch (error: unknown) {
    console.error("ERRO AO GERAR/SALVAR DARF INDIVIDUAL:", error);

    let errorMessage = "Falha ao gerar e salvar o PDF.";
    if (error instanceof Error) {
      errorMessage = `Falha ao salvar DARF individual: ${error.message}`;
    }

    return { success: false, message: errorMessage };
  }

  return {
    success: true,
    message: `DARF (Cód. ${calcResult.codigoReceita}) gerado e Relatório Unificado atualizado! ${calcResult.message !== "Cálculo bem-sucedido." ? calcResult.message : ""}`,
  };
}

export async function calculateUnifiedDarf(): Promise<ActionResult> {
  const { userId } = auth();
  if (!userId) redirect("/login");

  try {
    await calculateTax(AssetType.ACAO);
    await calculateTax(AssetType.FII);
    await calculateTax(AssetType.CRIPTO);

    return {
      success: true,
      message: "Relatório Mensal Unificado gerado/atualizado com sucesso!",
    };
  } catch (error: unknown) {
    console.error("ERRO AO GERAR DARF UNIFICADO:", error);

    let errorMessage = "Falha ao gerar o relatório unificado.";
    if (error instanceof Error) {
      errorMessage = `Falha ao gerar o relatório unificado: ${error.message}`;
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function calculateTaxForCron(userId: string) {
  const now = new Date();
  const referenceDate = new Date(now.getFullYear(), now.getMonth(), 1);

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;

  try {
    const acaoResult = await _calculateTaxForType(
      userId,
      AssetType.ACAO,
      referenceDate,
    );
    const fiiResult = await _calculateTaxForType(
      userId,
      AssetType.FII,
      referenceDate,
    );
    const criptoResult = await _calculateTaxForType(
      userId,
      AssetType.CRIPTO,
      referenceDate,
    );

    const totalTax = acaoResult.tax.plus(fiiResult.tax).plus(criptoResult.tax);

    if (totalTax.lessThanOrEqualTo(0)) {
      return null;
    }

    await _generateOrUpdateUnifiedDarf(userId, year, month);

    const unifiedDarf = await db.darf.findUnique({
      where: {
        userId_year_month_assetType: {
          userId,
          year,
          month,
          assetType: AssetType.UNIFICADA,
        },
      },
      select: { pdfUrl: true },
    });

    return unifiedDarf?.pdfUrl || null;
  } catch (error) {
    console.error(
      `Erro ao calcular imposto via Cron para user ${userId}:`,
      error,
    );
    return null;
  }
}

export async function simulateTax(
  assetType: AssetType,
  quantity: number,
  unitPrice: number,
  isDayTrade: boolean = false,
  isForeign: boolean = false,
) {
  const { userId } = auth();
  if (!userId) return { error: "Não autorizado" };

  const asset = await db.asset.findFirst({
    where: {
      portfolio: { userId },
      type: assetType,
      quantity: { gt: 0 },
    },
  });

  if (!asset) return { message: "Você não possui este ativo para vender." };

  const avgPrice = Number(asset.averagePrice);
  const saleValue = quantity * unitPrice;
  const costValue = quantity * avgPrice;
  const profit = saleValue - costValue;

  let tax = 0;
  let taxRate = 0;
  let irrf = 0; 

  if (assetType === AssetType.ACAO) {
    if (isDayTrade) {
      taxRate = 0.2;
      if (profit > 0) {
        tax = profit * taxRate;
        irrf = profit * 0.01; 
      }
    } else {
      taxRate = 0.15;
      irrf = saleValue * 0.00005; 
      if (saleValue <= 20000 && profit > 0) tax = 0;
      else if (profit > 0) tax = profit * taxRate;
    }
  } else if (assetType === AssetType.CRIPTO) {
    taxRate = 0.15;

    if (isForeign) {
      if (profit > 0) tax = profit * taxRate;
    } else {
      if (saleValue <= 35000 && profit > 0) {
        tax = 0;
      } else if (profit > 0) {
        tax = profit * taxRate;
      }
    }
  } else if (assetType === AssetType.FII) {
    taxRate = 0.2;
    if (profit > 0) tax = profit * taxRate;
    if (isDayTrade && profit > 0) irrf = profit * 0.01;
    else if (!isDayTrade) irrf = saleValue * 0.00005;
  }

  if (tax > 0) {
    tax = Math.max(0, tax - irrf);
  }

  return {
    profit,
    taxEstimate: tax,
    saleValue,
    isExempt: tax === 0 && profit > 0,
    isForeign,
    message:
      isForeign && assetType === AssetType.CRIPTO && tax > 0
        ? "Este imposto será devido na Declaração Anual (Exterior), não no DARF mensal."
        : undefined,
  };
}