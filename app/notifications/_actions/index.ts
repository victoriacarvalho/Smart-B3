// app/_actions/index.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

// ===============================================
// FUNÇÃO PARA ENVIAR WHATSAPP (COM DEBUG)
// ===============================================
async function sendTestWhatsappMessage(to: string) {
  const { WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;

  // -- LOGS PARA DEBUG --
  console.log("--- Iniciando envio de mensagem de teste ---");
  console.log(
    "ID do Número de Telefone:",
    WHATSAPP_PHONE_NUMBER_ID ? "Carregado" : "NÃO ENCONTRADO NO .ENV",
  );
  console.log(
    "Token de Acesso:",
    WHATSAPP_API_TOKEN ? "Carregado" : "NÃO ENCONTRADO NO .ENV",
  );
  // --------------------

  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error(
      "As credenciais da API do WhatsApp não estão configuradas no .env",
    );
  }

  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: to,
    type: "template",
    template: {
      name: "hello_world",
      language: { code: "en_US" },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    // -- LOGS PARA DEBUG --
    console.log("Status da Resposta da API:", response.status);
    console.log("Dados da Resposta da API:", responseData);
    console.log("--- Fim do envio de mensagem de teste ---");
    // --------------------

    if (!response.ok) {
      throw new Error(
        `Falha ao enviar mensagem: ${responseData.error?.message || "Erro desconhecido"}`,
      );
    }
    return { success: true };
  } catch (error) {
    console.error("Erro na função sendTestWhatsappMessage:", error);
    throw error;
  }
}

// ===============================================
// SCHEMAS E OUTRAS ACTIONS
// ===============================================
const updateWhatsappInfoSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório."),
  phoneNumber: z.string().trim().min(1, "O número de telefone é obrigatório."),
});

// Inclua aqui suas outras schemas e actions (upsertPortfolio, deleteTransaction, etc.)
async function sendMonthlyNotification(
  to: string,
  name: string,
  month: string,
) {
  const { WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;

  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("Credenciais do WhatsApp não configuradas.");
  }

  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: to.replace(/\D/g, ""), // Garante que o número não tenha máscara
    type: "template",
    template: {
      name: "monthly_tax_report", // O nome do template que você criou
      language: {
        code: "pt_BR", // O idioma do template
      },
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
    console.error(`Falha ao enviar para ${to}:`, errorData.error.message);
  } else {
    console.log(`Notificação enviada com sucesso para ${to}`);
  }
}
// ===============================================
// ACTION: WHATSAPP (Versão Corrigida)
// ===============================================
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

  // --- ALTERAÇÃO AQUI ---
  // Agora, a mensagem de teste será enviada para o número que o usuário digitou.
  // O número precisa estar sem máscara, apenas dígitos. Ex: 5531996207676
  const sanitizedPhoneNumber = phoneNumber.replace(/\D/g, "");
  await sendTestWhatsappMessage(sanitizedPhoneNumber);

  revalidatePath("/notifications");
  return {
    success: true,
    message: "Informações salvas e mensagem de teste enviada!",
  };
};

// Cole suas outras actions (upsertPortfolio, etc) aqui para garantir que elas continuem sendo exportadas.
