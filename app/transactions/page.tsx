import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { DataTable } from "@/app/_components/ui/data-table";
import { transactionColumns } from "./_columns";
// IMPORTANTE: Importe o componente de DIÁLOGO principal, não o botão isolado.
import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";
import { AddTransactionDialog } from "../_components/add-transaction-dialog";
import { ScrollArea } from "../_components/ui/scroll-area";

const TransactionsPage = async () => {
  // 1. Obter o userId do usuário logado para segurança.
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in"); // Redireciona se não estiver logado
  }

  // 2. Filtrar transações APENAS para o usuário logado e incluir os dados do ativo.
  const transactions = await db.transaction.findMany({
    where: {
      // Navega pela relação: Transaction -> Asset -> Portfolio -> User
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
      date: "desc", // Ordena as transações da mais recente para a mais antiga
    },
  });

  return (
    <>
      <Navbar />
      <div className="flex flex-col space-y-6 overflow-hidden p-6">
        {/* TÍTULO E BOTÃO */}
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Transações</h1>
          <AddTransactionDialog />
        </div>
        <ScrollArea className="h-full">
          <DataTable
            columns={transactionColumns}
            data={JSON.parse(JSON.stringify(transactions))}
          />
        </ScrollArea>
      </div>
    </>
  );
};

export default TransactionsPage;
