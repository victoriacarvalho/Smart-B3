"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

async function sendTestWhatsappMessage(to: string, name: string) {
  const { WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;

  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error(
      "As credenciais da API do WhatsApp não estão configuradas no .env",
    );
  }

  const updateWhatsappInfoSchema = z.object({
    name: z.string().trim().min(1, "O nome é obrigatório."),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "O número de telefone é obrigatório."),
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

    const sanitizedPhoneNumber = phoneNumber.replace(/\D/g, "");
    await sendTestWhatsappMessage(sanitizedPhoneNumber, name);

    revalidatePath("/notifications");
    return {
      success: true,
      message: "Informações salvas e mensagem de teste enviada!",
    };
  };

  export async function sendMonthlyNotification(
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
      to: to.replace(/\D/g, ""),
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
}
