"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { TrashIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { deleteTransaction } from "@/app/_actions";
import { DeleteConfirmationDialog } from "../transactions/_components/delete-confirmation-dialog";
import { TransactionColumnData } from "../transactions/_columns";

interface TransactionActionsProps {
  transaction: TransactionColumnData;
}

export function TransactionActions({
  transaction,
}: Readonly<TransactionActionsProps>) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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
          onClick={() => setIsDeleteOpen(true)}
          disabled={isPending}
          className="text-destructive hover:text-destructive"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      <DeleteConfirmationDialog
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </>
  );
}
