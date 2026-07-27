"use client";

import { AssetType, Transaction } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/_components/ui/button";
import { ArrowUpDown } from "lucide-react";
import {
  OPERATION_TYPE_LABELS,
  RETENTION_PERIOD_LABELS,
} from "@/app/_constants/transactions";
import Link from "next/link";
import { TransactionActions } from "@/app/_components/transactions-actions";
import TransactionTypeBadge from "../_components/type-badge";
import EditTransactionButton from "../_components/edit-transaction-button";

export type TransactionColumnData = Transaction & {
  asset: {
    symbol: string;
    type: AssetType;
  };
};

export const transactionColumns: ColumnDef<TransactionColumnData>[] = [
  {
    accessorKey: "asset.symbol",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ativo 
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const { assetId, asset } = row.original;
      return (
        <Link
          href={`/investment/${assetId}`}
          className="font-medium underline-offset-4 hover:underline whitespace-nowrap"
        >
          {asset.symbol.toUpperCase()}
        </Link>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row: { original: transaction } }) => (
      // Envolva o badge para garantir que não amasse
      <div className="whitespace-nowrap">
        <TransactionTypeBadge transaction={transaction} />
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {new Date(row.original.date).toLocaleDateString("pt-BR")}
      </div>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Quantidade",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {Number(row.original.quantity).toLocaleString("pt-BR")}
      </div>
    ),
  },
  {
    accessorKey: "unitPrice",
    header: "Preço Unitário",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(row.original.unitPrice))}
      </div>
    ),
  },
  {
    id: "totalValue",
    header: "Valor Total",
    cell: ({ row }) => {
      const { quantity, unitPrice, fees } = row.original;
      const total = Number(quantity) * Number(unitPrice) + Number(fees);
      return (
        <div className="whitespace-nowrap font-medium">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(total)}
        </div>
      );
    },
  },
  {
    id: "operationDetails",
    header: "Operação",
    cell: ({ row }) => {
      const assetType = row.original.asset.type;
      const { operationType, retentionPeriod } = row.original;

      let content = <span className="text-muted-foreground">-</span>;
      if ((assetType === "ACAO" || assetType === "CRIPTO") && operationType) {
        content = <>{OPERATION_TYPE_LABELS[operationType]}</>;
      } else if (assetType === "FII" && retentionPeriod) {
        content = <>{RETENTION_PERIOD_LABELS[retentionPeriod]}</>;
      }

      return <div className="whitespace-nowrap">{content}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right whitespace-nowrap">Ações</div>,
    cell: ({ row }) => {
      const transactionData = row.original;
      return (
        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
          <EditTransactionButton transaction={transactionData} />
          <TransactionActions transaction={transactionData} />
        </div>
      );
    },
  },
];
