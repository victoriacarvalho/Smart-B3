// app/notifications/_actions/send-whatsapp.ts
"use server";

export async function sendTestWhatsappMessage(to: string, name: string) {
  const { WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;

  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error(
      "As credenciais da API do WhatsApp não estão configuradas no .env",
    );
  }

  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  // O WhatsApp requer um "template" de mensagem para iniciar conversas.
  // "hello_world" é o template padrão fornecido pela Meta para testes.
  const payload = {
    messaging_product: "whatsapp",
    to: to,
    type: "template",
    template: {
      name: "hello_world",
      language: {
        code: "en_US", // O template padrão é em inglês
      },
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

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro da API do WhatsApp:", errorData);
      throw new Error(`Falha ao enviar mensagem: ${errorData.error.message}`);
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("Erro ao enviar mensagem de teste:", error);
    throw error;
  }
}
