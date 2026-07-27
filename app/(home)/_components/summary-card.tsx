import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { cn } from "@/app/_lib/utils";
import { ReactNode } from "react";

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  amount: number;
  size?: "small" | "large";
  isProfit?: boolean;
  tooltip?: string;
}

const SummaryCard = ({
  icon,
  title,
  amount,
  size = "small",
  isProfit, 
}: SummaryCardProps) => {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4">
        {icon}
        <p
          className={cn(
            size === "small" ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {title}
        </p>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "font-bold",
            size === "small" ? "text-2xl" : "text-4xl",
            isProfit !== undefined && (
              isProfit 
                ? "text-green-600 dark:text-green-500" 
                : "text-red-600 dark:text-red-500"
            )
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