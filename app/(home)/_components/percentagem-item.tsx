import { AssetType } from "@prisma/client";
import Link from "next/link";
import { ReactNode } from "react";

interface PercentageItemProps {
  icon: ReactNode;
  title: string;
  value: number;
  type: AssetType;
}

const PercentageItem = ({ icon, title, value, type }: PercentageItemProps) => {
  return (
    <Link
      href={`/transactions?type=${type}`}
      className="block rounded-lg transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center justify-between p-2">
        {/* Icone */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white bg-opacity-[3%] p-2">{icon}</div>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <p className="text-sm font-bold">{value}%</p>
      </div>
    </Link>
  );
};

export default PercentageItem;
