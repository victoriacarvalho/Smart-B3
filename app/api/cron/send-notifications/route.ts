import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { sendMonthlyNotification } from "@/app/notifications/_actions";
import { calculateTaxForCron } from "@/app/calculation/_actions/calculates-taxes";

export const dynamic = "force-dynamic";

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

    const today = new Date();
    const lastMonthDate = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );
    const monthName = lastMonthDate.toLocaleString("pt-BR", { month: "long" });
    const capitalizedMonth =
      monthName.charAt(0).toUpperCase() + monthName.slice(1);

    console.log(
      `Iniciando Cron para ${usersToNotify.length} usuários. Mês: ${capitalizedMonth}`,
    );

    const results = await Promise.allSettled(
      usersToNotify.map(async (user) => {
        if (!user.phoneNumber) return;

        const pdfUrl = await calculateTaxForCron(user.id);

        if (pdfUrl) {
          await sendMonthlyNotification(
            user.phoneNumber,
            user.name ?? "Investidor",
            capitalizedMonth,
            pdfUrl,
          );
          return `Enviado com DARF para ${user.email}`;
        } else {
          return `Sem imposto devido para ${user.email}`;
        }
      }),
    );

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results,
    });
  } catch (error) {
    console.error("Erro fatal no Cron Job:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
