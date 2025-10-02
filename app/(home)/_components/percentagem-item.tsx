import { Progress } from "@/app/_components/ui/progress";
import { ReactNode } from "react";

interface PercentageItemProps {
  icon: ReactNode;
  title: string;
  value: number;
  percentage: number;
}

const PercentageItem = ({
  icon,
  title,
  value,
  percentage,
}: PercentageItemProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white bg-opacity-[3%] p-2">{icon}</div>
          <div>
            <p className="text-sm font-bold">{title}</p>
            <p className="text-xs text-muted-foreground">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(value)}
            </p>
          </div>
        </div>
        <p className="text-sm font-bold">{percentage.toFixed(1)}%</p>
      </div>
      <Progress value={percentage} />
    </div>
  );
};

export default PercentageItem;
