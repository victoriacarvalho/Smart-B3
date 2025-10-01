import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { DataTable } from "@/app/_components/ui/data-table";
import { transactionColumns } from "./_columns";
// IMPORTANTE: Importe o componente de DIÁLOGO principal, não o botão isolado.
import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";

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
      <div className="space-y-6 p-6">
        <div className="flex w-full items-center justify-between">
          {/* 3. Usar o componente de diálogo principal, que já contém o botão "Adicionar Transação" 
            e toda a lógica de seleção de ativos. */}
        </div>

        {/* A tabela agora receberá os dados no formato correto */}
        <DataTable columns={transactionColumns} data={transactions} />
      </div>
    </>
  );
};

export default TransactionsPage;
