import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { transactionColumns } from "./_columns";
import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";
// 1. IMPORTE O 'ScrollBar'
import { ScrollArea, ScrollBar } from "../_components/ui/scroll-area";
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
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold sm:text-2xl">Transações</h1>
          <AddTransactionDialog />
        </div>
        <div className="relative flex-1">
          <ScrollArea className="absolute inset-0">
            <div className="min-w-max p-1">
              <DataTable
                columns={transactionColumns}
                data={JSON.parse(JSON.stringify(transactions))}
              />
            </div>
            {/* 2. ADICIONE A BARRA DE ROLAGEM HORIZONTAL */}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </main>
    </div>
  );
};

export default TransactionsPage;
