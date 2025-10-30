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
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const { assetId, asset } = row.original;
      return (
        <Link
          href={`/investment/${assetId}`}
          className="font-medium underline-offset-4 hover:underline"
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
      <TransactionTypeBadge transaction={transaction} />
    ),
  },
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString("pt-BR"),
  },
  {
    accessorKey: "quantity",
    header: "Quantidade",
    cell: ({ row }) => Number(row.original.quantity).toLocaleString("pt-BR"),
  },
  {
    accessorKey: "unitPrice",
    header: "Preço Unitário",
    cell: ({ row }) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(row.original.unitPrice)),
  },
  {
    id: "totalValue",
    header: "Valor Total",
    cell: ({ row }) => {
      const { quantity, unitPrice, fees } = row.original;
      const total = Number(quantity) * Number(unitPrice) + Number(fees);
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(total);
    },
  },
  {
    id: "operationDetails",
    header: "Operação",
    cell: ({ row }) => {
      const assetType = row.original.asset.type;
      const { operationType, retentionPeriod } = row.original;

      if ((assetType === "ACAO" || assetType === "CRIPTO") && operationType) {
        return OPERATION_TYPE_LABELS[operationType];
      }
      if (assetType === "FII" && retentionPeriod) {
        return RETENTION_PERIOD_LABELS[retentionPeriod];
      }
      return <span className="text-muted-foreground">-</span>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => {
      // 2. Obter a transação da linha atual
      const transactionData = row.original;

      return (
        <div className="flex items-center justify-end gap-1">
          <EditTransactionButton transaction={transactionData} />{" "}
          <TransactionActions transaction={transactionData} />
        </div>
      );
    },
  },
];
