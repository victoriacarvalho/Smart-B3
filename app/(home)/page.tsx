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
import { PortfolioHealth } from "./_components/portfolio-health";
import { startOfMonth, endOfMonth } from "date-fns";

interface HomeProps {
  searchParams: {
    startDate?: string;
    endDate?: string;
  };
}

const DashboardPage = async ({ searchParams }: HomeProps) => {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  const now = new Date();

  const startDate = searchParams.startDate
    ? new Date(searchParams.startDate)
    : startOfMonth(now);

  const endDate = searchParams.endDate
    ? new Date(searchParams.endDate)
    : endOfMonth(now);

  const dashboardData = await getDashboard(startDate, endDate).catch(
    (error) => {
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
    },
  );

  const cryptoAllocation = dashboardData.portfolioAllocation.find(
    (item) => item.type === "CRIPTO",
  );

  const cryptoTotal = cryptoAllocation ? Number(cryptoAllocation.value) : 0;
  const totalEquity = dashboardData.summary.currentPortfolioValue;

  return (
    <>
      <Navbar />
      <div className="flex h-full flex-col space-y-6 overflow-y-auto p-4 md:p-6 lg:overflow-hidden">
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <TimeSelect />
            <AddTransactionDialog />
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3 lg:overflow-hidden">
          
          <ScrollArea className="h-full lg:col-span-2">
            <div className="flex flex-col gap-6 lg:pr-6">
              <SummaryCards summary={dashboardData.summary} />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AssetPieChart
                  portfolioAllocation={dashboardData.portfolioAllocation || []}
                />
                <AssetAllocationCard
                  portfolioAllocation={dashboardData.portfolioAllocation || []}
                />
              </div>
            </div>
          </ScrollArea>

          
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-6 pb-6 lg:pb-0">
              <PortfolioHealth
                totalEquity={totalEquity}
                cryptoTotal={cryptoTotal}
              />

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