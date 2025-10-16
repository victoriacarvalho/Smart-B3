import { AddTransactionDialog } from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import AiReportButton from "./_components/ai-report-button";

const DashboardPage = async () => {
  return (
    <>
      <Navbar />
      <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <AiReportButton />
          <AddTransactionDialog />
          <div className="flex items-center gap-4"></div>
        </div>
      </div>
    </>
  );
};
export default DashboardPage;
