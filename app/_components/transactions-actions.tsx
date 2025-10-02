"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import UpsertTransactionDialog from "@/app/_components/upsert-transaction-dialog";
import { deleteTransaction, upsertTransaction } from "@/app/_actions";
import { DeleteConfirmationDialog } from "../transactions/_components/delete-confirmation-dialog";
import { TransactionColumnData } from "../transactions/_columns";

interface TransactionActionsProps {
  transaction: TransactionColumnData;
}

export function TransactionActions({ transaction }: TransactionActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleEditSubmit = async (data: any) => {
    startTransition(async () => {
      try {
        await upsertTransaction({ ...data, id: transaction.id });
        toast.success("Transação atualizada com sucesso!");
        setIsEditOpen(false);
      } catch (error) {
        toast.error("Erro ao atualizar a transação.");
        console.error(error);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteTransaction({ id: transaction.id });
        toast.success("Transação excluída com sucesso!");
        setIsDeleteOpen(false);
      } catch (error) {
        toast.error("Erro ao excluir a transação.");
        console.error(error);
      }
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditOpen(true)}
          disabled={isPending}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDeleteOpen(true)}
          disabled={isPending}
          className="text-destructive hover:text-destructive"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      {isEditOpen && (
        <UpsertTransactionDialog
          isOpen={isEditOpen}
          setIsOpen={setIsEditOpen}
          onSubmit={handleEditSubmit}
          isPending={isPending} // <-- ADICIONADO: Passa o estado de carregamento para o modal
          transactionId={transaction.id}
          assetInfo={{
            assetId: transaction.assetId,
            symbol: transaction.asset.symbol,
            name: transaction.asset.symbol,
            type: transaction.asset.type,
          }}
          defaultValues={{
            ...transaction,
            quantity: Number(transaction.quantity),
            unitPrice: Number(transaction.unitPrice),
            fees: Number(transaction.fees),
            date: new Date(transaction.date),
          }}
        />
      )}

      <DeleteConfirmationDialog
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </>
  );
}
