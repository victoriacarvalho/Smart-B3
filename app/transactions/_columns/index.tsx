"use client";

import {
  AssetType,
  OperationType,
  Transaction,
  RetentionPeriod,
} from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/_components/ui/button";
import { ArrowUpDown, TrashIcon } from "lucide-react";
import {
  OPERATION_TYPE_LABELS,
  RETENTION_PERIOD_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/app/_constants/transactions";
// Você precisará criar ou adaptar este botão de edição
// import EditTransactionButton from "../_components/edit-transaction-button";

// 1. Tipo de dado que a tabela espera receber
// Sua query Prisma deve ser: `db.transaction.findMany({ include: { asset: true } })`
export type TransactionColumnData = Transaction & {
  asset: {
    symbol: string;
    type: AssetType;
  };
};

export const transactionColumns: ColumnDef<TransactionColumnData>[] = [
  // Coluna para o SÍMBOLO DO ATIVO
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
      return (
        <div className="font-medium">
          {row.original.asset.symbol.toUpperCase()}
        </div>
      );
    },
  },

  // Coluna para o TIPO (Compra / Venda)
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.original.type;
      const label = TRANSACTION_TYPE_LABELS[type];
      const color = type === "COMPRA" ? "text-green-600" : "text-red-600";
      return <span className={`font-semibold ${color}`}>{label}</span>;
    },
  },

  // Coluna para a DATA
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString("pt-BR"),
  },

  // Coluna para a QUANTIDADE
  {
    accessorKey: "quantity",
    header: "Quantidade",
    cell: ({ row }) => Number(row.original.quantity).toLocaleString("pt-BR"),
  },

  // Coluna para o PREÇO UNITÁRIO
  {
    accessorKey: "unitPrice",
    header: "Preço Unitário",
    cell: ({ row }) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(row.original.unitPrice)),
  },

  // Coluna para o VALOR TOTAL (calculado)
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

  // Coluna para o TIPO DE OPERAÇÃO (condicional)
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

  // Coluna de AÇÕES (Editar / Deletar)
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      return (
        <div className="space-x-1 text-right">
          {/* <EditTransactionButton transaction={row.original} /> */}
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
