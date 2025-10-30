import {
  PiggyBank,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import SummaryCard from "./summary-card";

interface SummaryCardsProps {
  summary?: {
    totalNetProfit: number; // Não mais usado para o card de Lucro/Prejuízo
    totalTaxDue: number;
    totalSold: number;
    totalInvestedCost: number;
    currentPortfolioValue: number;
  };
}

const SummaryCards = ({ summary }: SummaryCardsProps) => {
  if (!summary) {
    return null;
  }

  // --- LÓGICA ANTIGA ---
  // const isProfit = summary.totalNetProfit >= 0;

  // --- LÓGICA NOVA ---
  // Calcula o lucro/prejuízo total da carteira
  const portfolioProfitLoss =
    summary.currentPortfolioValue - summary.totalInvestedCost;

  // Verifica se é lucro (positivo ou zero) ou prejuízo (negativo)
  const isPortfolioProfit = portfolioProfitLoss >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SummaryCard
          icon={<Wallet className="h-6 w-6 text-primary" />}
          title="Valor Total da Carteira"
          amount={summary.currentPortfolioValue}
          size="large"
        />
        <SummaryCard
          icon={
            isPortfolioProfit ? ( // <-- Usa a nova variável
              <TrendingUp className="h-6 w-6 text-green-600" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-600" />
            )
          }
          // Título atualizado para refletir o P/L total
          title={
            isPortfolioProfit
              ? "Lucro/Prejuízo da Carteira"
              : "Prejuízo da Carteira"
          }
          amount={portfolioProfitLoss} // <-- Usa a nova variável
          size="large"
          isProfit={isPortfolioProfit} // <-- Usa a nova variável
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SummaryCard
          icon={<PiggyBank className="h-5 w-5" />}
          title="Custo Total Investido"
          amount={summary.totalInvestedCost}
        />

        <SummaryCard
          icon={<ReceiptText className="h-5 w-5" />}
          title="Imposto Devido no Mês"
          amount={summary.totalTaxDue}
        />
      </div>
    </div>
  );
};

export default SummaryCards;
