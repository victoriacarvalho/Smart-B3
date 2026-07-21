// app/notifications/_actions/index.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { AssetType } from "@prisma/client";

const updateWhatsappInfoSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório."),
  phoneNumber: z.string().trim().min(1, "O número de telefone é obrigatório."),
});

export async function sendMonthlyNotification(
  to: string,
  name: string,
  month: string,
  taxDue: string, // Terceiro parâmetro obrigatório do template
) {
  const { WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;

  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("Credenciais do WhatsApp não configuradas.");
  }

  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const sanitizedTo = to.replace(/\D/g, "");

  const payload = {
    messaging_product: "whatsapp",
    to: sanitizedTo,
    type: "template",
    template: {
      name: "monthly_tax_report",
      language: {
        code: "pt_BR",
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: name },   // {{1}}
            { type: "text", text: month },  // {{2}}
            { type: "text", text: taxDue }, // {{3}}
          ],
        },
      ],
    },
  };

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
    console.error(`Falha ao enviar para ${to}:`, errorData.error?.message || errorData);
    throw new Error("Falha na API do WhatsApp.");
  } else {
    console.log(`Notificação de template enviada com sucesso para ${to}`);
  }
}

export const updateUserWhatsappInfo = async (
  params: z.infer<typeof updateWhatsappInfoSchema>,
) => {
  const { userId } = auth();
  if (!userId) throw new Error("Não autorizado.");

  const user = await clerkClient().users.getUser(userId);
  if (!user) throw new Error("Usuário não encontrado.");

  const { name, phoneNumber } = updateWhatsappInfoSchema.parse(params);

  try {
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
  } catch (error: unknown) {
    const dbError = error as { code?: string };
    if (dbError.code === "P2002") {
      return {
        success: false,
        message: "Erro: Este número já está cadastrado em outra conta.",
      };
    }
    throw dbError;
  }

  const sanitizedPhoneNumber = phoneNumber.replace(/\D/g, "");

  // Busca o último DARF unificado com o campo correto (taxDue)
  const lastUnifiedDarf = await db.darf.findFirst({
    where: {
      userId: userId,
      assetType: AssetType.UNIFICADA,
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { month: true, year: true, taxDue: true }, 
  });

  // Prepara o mês formatado
  const monthString = lastUnifiedDarf
    ? `${String(lastUnifiedDarf.month).padStart(2, "0")}/${lastUnifiedDarf.year}`
    : "Nenhum";

  // Prepara o valor do imposto formatado (ex: "150,50")
  const formattedTax = lastUnifiedDarf?.taxDue
    ? Number(lastUnifiedDarf.taxDue).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0,00";

  try {
    // Dispara o WhatsApp com as 3 variáveis exatas do template
    await sendMonthlyNotification(
      sanitizedPhoneNumber,
      name,
      monthString,
      formattedTax,
    );
  } catch (e) {
    console.error(
      "Aviso: Mensagem de notificação falhou, mas dados foram salvos.",
      e,
    );
  }

  revalidatePath("/notifications");
  return {
    success: true,
    message: "Informações salvas! Verifique seu WhatsApp.",
  };
};