import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/_lib/prisma";
import Navbar from "@/app/_components/navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { AddTransactionDialog } from "@/app/_components/add-transaction-button";
import AssetRealTimeInfo from "../_component/asset-real-time-info";

const InvestmentPage = async ({ params }: { params: { id: string } }) => {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  const asset = await db.asset.findUnique({
    where: {
      id: params.id,
      portfolio: {
        userId,
      },
    },
    include: {
      transactions: {
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  if (!asset) {
    return (
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold">Ativo não encontrado</h1>
          <p className="text-muted-foreground">
            O ativo que você está procurando não existe ou não pertence à sua
            carteira.
          </p>
        </div>
      </div>
    );
  }

  const totalInvested =
    asset.quantity.toNumber() * asset.averagePrice.toNumber();
  const totalQuantity = asset.quantity.toNumber();

  return (
    <div className="flex h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 flex-col gap-6 overflow-hidden p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{asset.symbol.toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground">{asset.type}</p>
          </div>

          <AddTransactionDialog />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AssetRealTimeInfo
            assetSymbol={asset.symbol}
            assetType={asset.type}
          />

          <Card>
            <CardHeader>
              <CardTitle>Quantidade Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {totalQuantity.toLocaleString("pt-BR")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Preço Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(asset.averagePrice.toNumber())}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent className="relative flex-1">
            <ScrollArea className="absolute inset-0 pr-6">
              {asset.transactions.length > 0 ? (
                asset.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="mb-4 flex items-center justify-between border-b pb-4 last:mb-0 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p
                        className={`font-semibold ${
                          tx.type === "COMPRA"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {tx.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-right font-semibold">
                        {tx.quantity.toNumber().toLocaleString("pt-BR")}
                      </p>
                      <p className="text-right text-sm text-muted-foreground">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(tx.unitPrice.toNumber())}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma transação encontrada para este ativo.
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InvestmentPage;
