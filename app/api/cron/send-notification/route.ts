// app/api/cron/send-notifications/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { sendMonthlyNotification } from "@/app/_actions";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const usersToNotify = await db.user.findMany({
      where: {
        whatsappConsent: true,
        phoneNumber: { not: null },
      },
    });

    if (usersToNotify.length === 0) {
      return NextResponse.json({ message: "Nenhum usuário para notificar." });
    }

    const currentMonth = new Date().toLocaleString("pt-BR", {
      month: "long",
      timeZone: "America/Sao_Paulo",
    });
    const monthName =
      currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

    const promises = usersToNotify.map((user) =>
      sendMonthlyNotification(
        user.phoneNumber!,
        user.name ?? "Usuário",
        monthName,
      ),
    );

    await Promise.allSettled(promises);

    return NextResponse.json({
      success: true,
      message: `Notificações enviadas para ${usersToNotify.length} usuários.`,
    });
  } catch (error) {
    console.error("Erro no Cron Job de notificação:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
