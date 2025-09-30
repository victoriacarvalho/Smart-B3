import {
  PiggyBank,
  TrendingDown,
  TrendingUp,
  FileText,
  CircleDollarSign,
} from "lucide-react";
import SummaryCard from "./summary-card"; // Usaremos o componente reutilizável abaixo

// 1. A interface de props agora reflete os dados do dashboard de investimentos
interface SummaryCardsProps {
  totalNetProfit: number;
  totalTaxDue: number;
  totalSold: number;
  totalInvestedCost: number;
}

const SummaryCards = ({
  totalNetProfit,
  totalTaxDue,
  totalSold,
  totalInvestedCost,
}: SummaryCardsProps) => {
  // 2. Lógica para tornar o card de lucro/prejuízo dinâmico
  const isProfit = totalNetProfit >= 0;

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL: LUCRO/PREJUÍZO LÍQUIDO */}
      <SummaryCard
        icon={
          isProfit ? (
            <TrendingUp className="h-6 w-6 text-green-600" />
          ) : (
            <TrendingDown className="h-6 w-6 text-red-600" />
          )
        }
        title={isProfit ? "Lucro Líquido no Mês" : "Prejuízo Líquido no Mês"}
        amount={totalNetProfit}
        size="large"
        isProfit={isProfit}
      />

      {/* OUTROS CARDS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SummaryCard
          icon={<PiggyBank className="h-5 w-5" />}
          title="Custo Total Investido"
          amount={totalInvestedCost}
          tooltip="Valor total de compra dos ativos atualmente em carteira."
        />
        <SummaryCard
          icon={<FileText className="h-5 w-5" />}
          title="Imposto Devido no Mês"
          amount={totalTaxDue}
          tooltip="Valor de imposto a ser pago referente às vendas com lucro no mês."
        />
        <SummaryCard
          icon={<CircleDollarSign className="h-5 w-5" />}
          title="Total Vendido no Mês"
          amount={totalSold}
          tooltip="Soma total das vendas de ativos realizadas no mês."
        />
      </div>
    </div>
  );
};

export default SummaryCards;
