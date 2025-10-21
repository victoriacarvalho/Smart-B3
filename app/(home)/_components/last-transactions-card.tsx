"use client";

import { Button } from "@/app/_components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import Link from "next/link";
import { AssetType, Transaction, TransactionType } from "@prisma/client";
import AssetTypeIcon from "./asset-type-icon";
import { cn } from "@/app/_lib/utils";

export type DashboardTransaction = Transaction & {
  asset: {
    symbol: string;
    type: AssetType;
  };
};

interface LastTransactionsCardProps {
  lastTransactions: DashboardTransaction[];
}

const LastTransactionsCard = ({
  lastTransactions,
}: LastTransactionsCardProps) => {
  return (
    <ScrollArea className="h-full rounded-md border">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-bold">Últimas Transações</CardTitle>
        <Button variant="outline" className="rounded-full font-bold" asChild>
          <Link href="/transactions">Ver mais</Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-2">
        {lastTransactions.length === 0 && (
          <p className="pt-4 text-sm text-muted-foreground">
            Nenhuma transação registrada.
          </p>
        )}

        {lastTransactions.map((transaction) => {
          const totalValue =
            Number(transaction.quantity) * Number(transaction.unitPrice) +
            Number(transaction.fees);

          const isPurchase = transaction.type === TransactionType.COMPRA;

          return (
            <Link
              href={`/investment/${transaction.assetId}`}
              key={transaction.id}
              className="block rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <AssetTypeIcon
                      type={transaction.asset.type}
                      className="h-5 w-5"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold">
                      {transaction.asset.symbol.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <p
                  className={cn(
                    "text-sm font-bold",
                    isPurchase ? "text-green-600" : "text-red-600",
                  )}
                >
                  {isPurchase ? "+" : "-"}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalValue)}
                </p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </ScrollArea>
  );
};

export default LastTransactionsCard;
