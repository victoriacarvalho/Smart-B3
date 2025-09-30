import { AddTransactionDialog } from "../_components/add-transaction-dialog"; // Verifique o caminho para seu componente Select

const TransactionsPage = async () => {
  return (
    <div className="space-y-6 p-6">
      {/* TÍTULO E BOTÃO */}
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">Transações</h1>
        <AddTransactionDialog />
      </div>
    </div>
  );
};

export default TransactionsPage;
