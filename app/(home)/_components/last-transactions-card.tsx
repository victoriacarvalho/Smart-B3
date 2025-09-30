"use client";

import { Button } from "@/app/_components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { DashboardTransaction } from "../types";
import Link from "next/link";
import { TransactionType } from "@prisma/client";
import { cn } from "@/lib/utils";
import AssetTypeIcon from "./asset-type-icon"; // Criaremos este componente a seguir

interface LastTransactionsCardProps {
  lastTransactions: DashboardTransaction[];
}

const LastTransactionsCard = ({
  lastTransactions,
}: LastTransactionsCardProps) => {
  return (
    <ScrollArea className="rounded-md border">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-bold">Últimas Transações</CardTitle>
        <Button variant="outline" className="rounded-full font-bold" asChild>
          <Link href="/transactions">Ver mais</Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Adiciona uma mensagem caso não haja transações */}
        {lastTransactions.length === 0 && (
          <p className="pt-4 text-sm text-muted-foreground">
            Nenhuma transação registrada no período.
          </p>
        )}

        {lastTransactions.map((transaction) => {
          // Calcula o valor total da operação
          const totalValue =
            Number(transaction.quantity) * Number(transaction.unitPrice) +
            Number(transaction.fees);

          const isSale = transaction.type === TransactionType.VENDA;

          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {/* Ícone dinâmico baseado no tipo de ativo */}
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

              {/* Valor formatado com cor e prefixo dinâmicos */}
              <p
                className={cn(
                  "text-sm font-bold",
                  isSale ? "text-green-600" : "text-red-600",
                )}
              >
                {isSale ? "+" : "-"}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalValue)}
              </p>
            </div>
          );
        })}
      </CardContent>
    </ScrollArea>
  );
};

export default LastTransactionsCard;
