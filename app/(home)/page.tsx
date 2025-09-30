import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDashboard } from "../_data/get-dashboard";
import Navbar from "@/app/_components/navbar";
import TimeSelect from "./_components/time-select";
import SummaryCards from "./_components/summary-cards";
import LastTransactionsCard from "./_components/last-transactions-card";

// ADICIONE A IMPORTAÇÃO QUE FALTAVA AQUI
import AssetProfitPieChart from "./_components/asset-profit-pie-chart";

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
    redirect(`/dashboard?year=${currentYear}&month=${currentMonth}`);
  }

  const dashboardData = await getDashboard(year, month);

  return (
    <>
      <Navbar />
      <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <TimeSelect />
        </div>

        <div className="grid h-full grid-cols-1 gap-6 overflow-hidden md:grid-cols-[2fr,1fr]">
          {/* Coluna Principal (Esquerda) */}
          <div className="flex flex-col gap-6 overflow-hidden">
            <SummaryCards
              totalNetProfit={dashboardData.totalNetProfit}
              totalTaxDue={dashboardData.totalTaxDue}
              totalSold={dashboardData.totalSold}
              totalInvestedCost={dashboardData.totalInvestedCost}
            />
            <AssetProfitPieChart
              profitByAssetType={dashboardData.profitByAssetType}
            />
          </div>

          {/* Coluna Lateral (Direita) */}
          <LastTransactionsCard
            lastTransactions={dashboardData.lastTransactions}
          />
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
