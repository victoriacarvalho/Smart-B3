import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";
import { AddTransactionDialog } from "../_components/add-transaction-button";
import AiReportButton from "./_components/ai-report-button";

interface HomeProps {
  searchParams: {
    year?: string;
    month?: string;
  };
}

const DashboardPage = async ({ searchParams }: HomeProps) => {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Lógica de data (já presente no seu repo v1.0)
  const year = searchParams.year ? parseInt(searchParams.year) : currentYear;
  const month = searchParams.month
    ? parseInt(searchParams.month)
    : currentMonth;

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    redirect(`/?year=${currentYear}&month=${currentMonth}`);
  }

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col gap-6 overflow-hidden p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold sm:text-2xl">Dashboard</h1>
          <div className="flex items-center gap-2">
            <AiReportButton />
            <AddTransactionDialog />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
