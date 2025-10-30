import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/app/_components/navbar";
import TimeSelect from "./_components/time-select";
import SummaryCards from "./_components/summary-cards";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { getDashboard } from "../_data/get-dashboard";
import { AddTransactionDialog } from "../_components/add-transaction-button";
import AssetPieChart from "./_components/asset-pie-chart";
import AssetAllocationCard from "./_components/asset-alocation-card";
import MarketMoversCard from "./_components/market-movers-card";
import LastTransactionsCard from "./_components/last-transactions-card";

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

  const dashboardData = await getDashboard(year, month).catch((error) => {
    console.error("Falha ao carregar dados do dashboard:", error);
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
        <div className="flex items-center justify-end lg:justify-between">
          <h1 className="hidden text-2xl font-bold lg:block">Dashboard</h1>
          <div className="flex items-center gap-4">
            <AddTransactionDialog />
            <TimeSelect />
          </div>
        </div>

        {/* --- LAYOUT PRINCIPAL MODIFICADO --- */}
        <div className="grid h-full grid-cols-1 gap-6 overflow-hidden lg:grid-cols-3">
          {/* Coluna da Esquerda (2/3) - Gráficos e Resumo */}
          <ScrollArea className="h-full lg:col-span-2">
            <div className="flex flex-col gap-6 pr-6">
              {" "}
              <SummaryCards summary={dashboardData.summary} />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AssetPieChart
                  portfolioAllocation={dashboardData.portfolioAllocation || []}
                />
                <AssetAllocationCard
                  portfolioAllocation={dashboardData.portfolioAllocation || []}
                />
              </div>
              {/* O LastTransactionsCard FOI MOVIDO DAQUI */}
            </div>
          </ScrollArea>

          {/* Coluna da Direita (1/3) - Cards Laterais */}
          {/* Agora esta coluna é uma ScrollArea para comportar os dois cards */}
          <ScrollArea className="hidden h-full lg:block">
            <div className="flex flex-col gap-6">
              <MarketMoversCard />
              <LastTransactionsCard
                lastTransactions={(dashboardData.lastTransactions || []).slice(
                  0,
                  3,
                )}
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
