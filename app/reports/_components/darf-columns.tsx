"use client";

import { Darf } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { DownloadIcon } from "lucide-react";
import Link from "next/link";

const assetTypeNames = {
  ACAO: "Ações",
  FII: "Fundos Imobiliários",
  CRIPTO: "Criptomoedas",
};

export type DarfColumnData = Darf;

export const darfColumns: ColumnDef<DarfColumnData>[] = [
  {
    accessorKey: "month",
    header: "Competência",
    cell: ({ row }) => {
      const { month, year } = row.original;
      // Formata como "MM/AAAA"
      return `${String(month).padStart(2, "0")}/${year}`;
    },
  },
  {
    accessorKey: "assetType",
    header: "Ativo",
    cell: ({ row }) => assetTypeNames[row.original.assetType],
  },
  {
    accessorKey: "taxDue",
    header: () => <div className="text-right">Valor (R$)</div>,
    cell: ({ row }) => {
      const amount = Number(row.original.taxDue);
      return (
        <div className="text-right font-medium">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(amount)}
        </div>
      );
    },
  },

  {
    id: "actions",
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => {
      const darf = row.original;
      return (
        <div className="text-right">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Link href={darf.pdfUrl} target="_blank" download>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Ver PDF
            </Link>
          </Button>
        </div>
      );
    },
  },
];
