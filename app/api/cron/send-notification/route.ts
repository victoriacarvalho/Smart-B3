// app/api/cron/send-notifications/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
// Importe a função que acabamos de criar
import { sendMonthlyNotification } from "@/app/_actions"; // Ajuste o caminho se necessário

export async function GET(request: Request) {
  // Protege a rota para ser chamada apenas pelo Vercel
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const usersToNotify = await db.user.findMany({
      where: {
        whatsappConsent: true,
        phoneNumber: {
          not: null,
        },
      },
    });

    if (usersToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum usuário para notificar.",
      });
    }

    const currentMonthName = new Date().toLocaleString("pt-BR", {
      month: "long",
    });

    // Envia uma notificação para cada usuário
    for (const user of usersToNotify) {
      if (user.name && user.phoneNumber) {
        await sendMonthlyNotification(
          user.phoneNumber,
          user.name,
          currentMonthName,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `${usersToNotify.length} notificações enviadas.`,
    });
  } catch (error) {
    console.error("Erro no Cron Job:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao processar notificações." },
      { status: 500 },
    );
  }
}
