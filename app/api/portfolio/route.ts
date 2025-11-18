import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { toast } from "sonner";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const portfolio = await db.portfolio.findFirst({
      where: { userId: userId },
      include: {
        assets: {
          orderBy: {
            symbol: "asc",
          },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json([portfolio]);
  } catch (error) {
    console.error("Erro ao verificar webhook:", error);
    toast.error("[API_PORTFOLIO_GET]");
    return NextResponse.json(
      { error: "Erro interno ao buscar a carteira." },
      { status: 500 },
    );
  }
}
