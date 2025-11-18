import { db } from "@/app/_lib/prisma";
import { DataTable } from "@/app/_components/ui/data-table";
import { transactionColumns } from "./_columns";
import { AddTransactionDialog } from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ScrollArea } from "../_components/ui/scroll-area";
import TimeSelect from "../(home)/_components/time-select";
interface TransactionsPageProps {
  searchParams: {
    month?: string;
    year?: string;
  };
}

const TransactionsPage = async ({ searchParams }: TransactionsPageProps) => {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  const month = searchParams.month
    ? parseInt(searchParams.month)
    : new Date().getMonth() + 1;
  const year = searchParams.year
    ? parseInt(searchParams.year)
    : new Date().getFullYear();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

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
