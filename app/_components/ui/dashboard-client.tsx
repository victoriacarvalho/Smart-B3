import {
  PiggyBank,
  TrendingDown,
  TrendingUp,
  FileText,
  CircleDollarSign,
  Wallet,
} from "lucide-react";
import SummaryCard from "./summary-card";

interface SummaryCardsProps {
  summary: {
    totalNetProfit: number;
    totalTaxDue: number;
    totalSold: number;
    totalInvestedCost: number;
    currentPortfolioValue: number;
  };
}

const SummaryCards = ({ summary }: SummaryCardsProps) => {
  const isProfit = summary.totalNetProfit >= 0;

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
            isProfit ? (
              <TrendingUp className="h-6 w-6 text-green-600" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-600" />
            )
          }
          title={isProfit ? "Lucro/Prejuízo Total" : "Prejuízo Total"}
          amount={summary.totalNetProfit}
          size="large"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SummaryCard
          icon={<PiggyBank className="h-5 w-5" />}
          title="Custo Total Investido"
          amount={summary.totalInvestedCost}
          tooltip="Valor total de compra dos ativos atualmente em carteira."
        />
        <SummaryCard
          icon={<FileText className="h-5 w-5" />}
          title="Imposto Devido no Mês"
          amount={summary.totalTaxDue}
          tooltip="Valor de imposto a ser pago referente às vendas com lucro no mês."
        />
        <SummaryCard
          icon={<CircleDollarSign className="h-5 w-5" />}
          title="Total Vendido no Mês"
          amount={summary.totalSold}
          tooltip="Soma total das vendas de ativos realizadas no mês."
        />
      </div>
    </div>
  );
};

export default SummaryCards;
