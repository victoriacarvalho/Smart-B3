import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  amount: number;
  size?: "small" | "large";
  isProfit?: boolean; // Propriedade para controlar a cor
}

const SummaryCard = ({
  icon,
  title,
  amount,
  size = "small",
  isProfit,
}: SummaryCardProps) => {
  // Define a cor com base no lucro ou prejuízo, apenas para cards grandes
  const amountColor =
    size === "large" ? (isProfit ? "text-green-500" : "text-red-500") : "";

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4">
        {icon}
        <p
          className={`${size === "small" ? "text-muted-foreground" : "text-white"}`}
        >
          {title}
        </p>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "font-bold",
            size === "small" ? "text-2xl" : "text-4xl",
            amountColor, // Aplica a cor condicional
          )}
        >
          {Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(amount)}
        </p>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
