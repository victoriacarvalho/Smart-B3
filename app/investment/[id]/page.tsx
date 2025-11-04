import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/_lib/prisma";
import Navbar from "@/app/_components/navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card"; // Mantemos para o Histórico de Transações
import { AddTransactionDialog } from "@/app/_components/add-transaction-button";
import AssetRealTimeInfo from "../_component/asset-real-time-info";
import { CometCard } from "@/app/_components/ui/comet-card";

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
      <>
        <Navbar />
        <div className="flex h-full flex-col items-center justify-center p-6">
          <h1 className="text-2xl font-bold">Ativo não encontrado</h1>
          <p className="text-muted-foreground">
            O ativo que você está procurando não existe ou não pertence à sua
            carteira.
          </p>
        </div>
      </>
    );
  }

  const totalInvested =
    asset.quantity.toNumber() * asset.averagePrice.toNumber();
  const totalQuantity = asset.quantity.toNumber();

  return (
    <>
      <Navbar />
      <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{asset.symbol.toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground">{asset.type}</p>
          </div>
          <AddTransactionDialog />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Este componente é separado, para aplicar o efeito 3D nele,
              a modificação teria que ser feita *dentro* do arquivo AssetRealTimeInfo.tsx */}
          <AssetRealTimeInfo
            assetSymbol={asset.symbol}
            assetType={asset.type}
          />

          {/* --- CARD "QUANTIDADE TOTAL" TRANSFORMADO --- */}
          <CometCard>
            <div className="flex h-full w-full flex-col justify-start rounded-[16px] border-0 bg-[#1F2121] p-6 saturate-0">
              {/* Título (similar ao CardTitle) */}
              <h3 className="font-mono text-sm font-medium text-gray-400">
                Quantidade Total
              </h3>
              {/* Conteúdo (similar ao CardContent) */}
              <p className="mt-2 text-2xl font-bold text-white">
                {totalQuantity.toLocaleString("pt-BR")}
              </p>
            </div>
          </CometCard>

          {/* --- CARD "PREÇO MÉDIO" TRANSFORMADO --- */}
          <CometCard>
            <div className="flex h-full w-full flex-col justify-start rounded-[16px] border-0 bg-[#1F2121] p-6 saturate-0">
              <h3 className="font-mono text-sm font-medium text-gray-400">
                Preço Médio
              </h3>
              <p className="mt-2 text-2xl font-bold text-white">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(asset.averagePrice.toNumber())}
              </p>
            </div>
          </CometCard>

          {/* --- CARD "TOTAL INVESTIDO" TRANSFORMADO --- */}
          <CometCard>
            <div className="flex h-full w-full flex-col justify-start rounded-[16px] border-0 bg-[#1F2121] p-6 saturate-0">
              <h3 className="font-mono text-sm font-medium text-gray-400">
                Total Investido
              </h3>
              <p className="mt-2 text-2xl font-bold text-white">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalInvested)}
              </p>
            </div>
          </CometCard>

          {/* O card que eu adicionei erroneamente foi removido */}
        </div>

        {/* O Histórico de Transações permanece com o Card padrão */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default InvestmentPage;
