import { db } from "@/app/_lib/prisma";
import { DataTable } from "@/app/_components/ui/data-table";
import { transactionColumns } from "./_columns";
import { AddTransactionDialog } from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ScrollArea } from "../_components/ui/scroll-area";
import TimeSelect from "../(home)/_components/time-select";
import { startOfMonth, endOfMonth, endOfDay } from "date-fns"; // <--- 1. ADICIONE ESTE IMPORT

interface TransactionsPageProps {
  searchParams: {
    startDate?: string; // <--- 2. ALTERE AQUI (remova month/year)
    endDate?: string;
  };
}

const TransactionsPage = async ({ searchParams }: TransactionsPageProps) => {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  // 3. SUBSTITUA A LÓGICA DE DATA POR ESTA:
  const now = new Date();

  const startDate = searchParams.startDate
    ? new Date(searchParams.startDate)
    : startOfMonth(now);

  const endDate = searchParams.endDate
    ? endOfDay(new Date(searchParams.endDate)) // Garante que pegue até o último segundo do dia
    : endOfMonth(now);
  // ----------------------------------------

  const transactions = await db.transaction.findMany({
    where: {
      asset: {
        portfolio: {
          userId: userId,
        },
      },
      date: {
        gte: startDate,
        lte: endDate,
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
    <>
      <Navbar />
      <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Transações</h1>

          <div className="flex items-center gap-3">
            <TimeSelect />
            <AddTransactionDialog />
          </div>
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
