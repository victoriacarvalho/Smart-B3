import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDashboard } from "../_data/get-dashboard";
import Navbar from "@/app/_components/navbar";
import TimeSelect from "./_components/time-select";
import SummaryCards from "./_components/summary-cards";
import LastTransactionsCard from "./_components/last-transactions-card";
import AssetPieChart from "./_components/asset-pie-chart";
import { AddTransactionDialog } from "@/app/_components/add-transaction-dialog";
import ProfitBarChart from "./_components/profit-bar-chart.tsx";

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

  const year = searchParams.year ? parseInt(searchParams.year) : currentYear;
  const month = searchParams.month
    ? parseInt(searchParams.month)
    : currentMonth;

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    redirect(`/?year=${currentYear}&month=${currentMonth}`);
  }

  // Adiciona tratamento de erro para a busca de dados
  const dashboardData = await getDashboard(year, month).catch((error) => {
    console.error("Falha ao carregar dados do dashboard:", error);
    // Retorna um objeto com arrays vazios em caso de erro para evitar que a página quebre
    return {
      summary: {
        totalNetProfit: 0,
        totalTaxDue: 0,
        totalSold: 0,
        totalInvestedCost: 0,
        currentPortfolioValue: 0,
      },
      lastTransactions: [],
      profitByAssetType: [],
      portfolioAllocation: [],
    };
  });

  return (
    <>
      <Navbar />
      <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <AddTransactionDialog />
            <TimeSelect />
          </div>
        </div>

        <div className="grid h-full grid-cols-1 gap-6 overflow-hidden lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <SummaryCards summary={dashboardData.summary} />
            <ProfitBarChart data={dashboardData.profitByAssetType || []} />
          </div>

          <div className="flex flex-col gap-6">
            <AssetPieChart
              portfolioAllocation={dashboardData.portfolioAllocation || []}
            />
            <LastTransactionsCard
              lastTransactions={dashboardData.lastTransactions || []}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
