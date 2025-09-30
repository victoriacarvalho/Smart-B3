// Exemplo em /app/dashboard/page.tsx

import { AddTransactionDialog } from "../_components/add-transaction-dialog"; // Verifique o caminho para seu componente Select
export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meu Dashboard</h1>

        {/* Basta colocar o novo componente aqui */}
        <AddTransactionDialog />
      </div>

      {/* ... resto do conteúdo do seu dashboard ... */}
    </div>
  );
}
