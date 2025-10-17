import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { transactionColumns } from "./_columns";
import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";
import { ScrollArea } from "../_components/ui/scroll-area";
import { AddTransactionDialog } from "../_components/add-transaction-button";
import { DataTable } from "../_components/ui/data-table";

const TransactionsPage = async () => {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const transactions = await db.transaction.findMany({
    where: {
      asset: {
        portfolio: {
          userId: userId,
        },
      },
    },
    include: {
      asset: {
        select: {
          symbol: true,
          type: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return (
    // ALTERAÇÃO 1: Estrutura principal para ocupar a tela inteira.
    // Isso garante que a área de scroll saiba qual altura preencher.
    <div className="flex h-screen flex-col">
      <Navbar />
      {/* ALTERAÇÃO 2: Área de conteúdo principal.
          - `flex-1` faz este container ocupar todo o espaço vertical restante.
          - `p-4 md:p-6` ajusta o padding para ser responsivo.
          - `overflow-hidden` é importante para conter a ScrollArea. */}
      <main className="flex flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6">
        {/* ALTERAÇÃO 3: Cabeçalho da página.
            - `flex-wrap` permite que os itens quebrem a linha em telas muito pequenas.
            - `gap-2` adiciona um espaçamento entre os itens se eles quebrarem a linha. */}
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold sm:text-2xl">Transações</h1>
          <AddTransactionDialog />
        </div>
        {/* ALTERAÇÃO 4: Container para a ScrollArea.
            - `relative` e `flex-1` criam um container que preenche o espaço disponível,
              permitindo que a ScrollArea se expanda corretamente. */}
        <div className="relative flex-1">
          {/* A `ScrollArea` agora preenche seu container pai com `absolute inset-0`.
              Isso garante que ela ocupe todo o espaço disponível, tanto vertical
              quanto horizontalmente (para o conteúdo interno). */}
          <ScrollArea className="absolute inset-0">
            <DataTable
              columns={transactionColumns}
              data={JSON.parse(JSON.stringify(transactions))}
            />
          </ScrollArea>
        </div>
      </main>
    </div>
  );
};

export default TransactionsPage;
