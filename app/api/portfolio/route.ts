import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const user = await clerkClient().users.getUser(userId);
    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress ?? "",
        name: user.firstName,
      },
    });

    let portfolio = await db.portfolio.findFirst({
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
      console.log(
        `Nenhuma carteira encontrada para o userId: ${userId}. Criando uma nova.`,
      );
      portfolio = await db.portfolio.create({
        data: {
          name: "Carteira Principal",
          userId: userId,
        },
        include: {
          assets: true,
        },
      });
    }

    return NextResponse.json([portfolio]);
  } catch (error) {
    console.error("[API_PORTFOLIO_GET]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar ou criar a carteira." },
      { status: 500 },
    );
  }
}
