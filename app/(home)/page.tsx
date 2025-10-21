import { AddTransactionDialog } from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import TimeSelect from "./_components/time-select";

const DashboardPage = async () => {
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
      </div>
    </>
  );
};
export default DashboardPage;
