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
import { startOfMonth, endOfMonth } from "date-fns"; // <--- 1. Importe isso

interface HomeProps {
  searchParams: {
    startDate?: string; // <--- 2. Mudou de year/month para startDate/endDate
    endDate?: string;
  };
}

const DashboardPage = async ({ searchParams }: HomeProps) => {
  const { userId } = auth();
  if (!userId) {
    redirect("/login");
  }

  // --- 3. NOVA LÓGICA DE DATA ---
  const now = new Date();

  // Se não houver params, usa o início e fim do mês atual como padrão
  const startDate = searchParams.startDate
    ? new Date(searchParams.startDate)
    : startOfMonth(now);

  const endDate = searchParams.endDate
    ? new Date(searchParams.endDate)
    : endOfMonth(now);
  // -----------------------------

  // --- 4. PASSA AS DATAS PARA O GET DASHBOARD ---
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

  // --- CÁLCULOS PARA O PORTFOLIO HEALTH ---
  const cryptoAllocation = dashboardData.portfolioAllocation.find(
    (item) => item.type === "CRIPTO",
  );

  const cryptoTotal = cryptoAllocation ? Number(cryptoAllocation.value) : 0;
  const totalEquity = dashboardData.summary.currentPortfolioValue;
  // ---------------------------------------

  return (
    <>
      <Navbar />
      <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
        <div className="flex items-center justify-end lg:justify-between">
          <h1 className="hidden text-2xl font-bold lg:block">Dashboard</h1>
          <div className="flex items-center gap-4">
            <AddTransactionDialog />
            <TimeSelect /> {/* O TimeSelect agora controla a URL inteira */}
          </div>
        </div>

        <div className="grid h-full grid-cols-1 gap-6 overflow-hidden lg:grid-cols-3">
          {/* COLUNA ESQUERDA/CENTRAL (SCROLLABLE) */}
          <ScrollArea className="h-full lg:col-span-2">
            <div className="flex flex-col gap-6 pr-6">
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

          {/* COLUNA DIREITA (FIXA NO DESKTOP) */}
          <ScrollArea className="hidden h-full lg:block">
            <div className="flex flex-col gap-6">
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
