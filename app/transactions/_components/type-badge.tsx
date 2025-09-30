import { Badge } from "@/app/_components/ui/badge";
import { Transaction, TransactionType } from "@prisma/client";
import { CircleIcon } from "lucide-react";

interface TransactionTypeBadgeProps {
  transaction: Transaction;
}

const TransactionTypeBadge = ({ transaction }: TransactionTypeBadgeProps) => {
  if (transaction.type === TransactionType.COMPRA) {
    return (
      <Badge className="bg-muted font-bold text-primary hover:bg-muted">
        <CircleIcon className="mr-2 fill-primary" size={10} />
        Compra
      </Badge>
    );
  }
  if (transaction.type === TransactionType.VENDA) {
    return (
      <Badge className="font bold bg-danger text-danger bg-opacity-10">
        <CircleIcon className="fill-danger mr-2" size={10} />
        Venda
      </Badge>
    );
  }
};

export default TransactionTypeBadge;
