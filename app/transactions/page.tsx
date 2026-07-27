import { db } from "@/app/_lib/prisma";
import { DataTable } from "@/app/_components/ui/data-table";
import { transactionColumns } from "./_columns";
import { AddTransactionDialog } from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ScrollArea } from "../_components/ui/scroll-area";
import TimeSelect from "../(home)/_components/time-select";
import { startOfMonth, endOfMonth, endOfDay } from "date-fns"; 

interface TransactionsPageProps {
  searchParams: {
    startDate?: string; 
    endDate?: string;
  };
}

const TransactionsPage = async ({ searchParams }: TransactionsPageProps) => {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  const now = new Date();

  const startDate = searchParams.startDate
    ? new Date(searchParams.startDate)
    : startOfMonth(now);

  const endDate = searchParams.endDate
    ? endOfDay(new Date(searchParams.endDate)) 
    : endOfMonth(now);


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
      <div className="flex h-full flex-col space-y-6 p-4 md:p-6">
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
          <h1 className="text-2xl font-bold">Transações</h1>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <TimeSelect />
            <AddTransactionDialog />
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <ScrollArea className="h-full w-full rounded-md">
            <DataTable
              columns={transactionColumns}
              data={JSON.parse(JSON.stringify(transactions))}
            />
           
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default TransactionsPage;
