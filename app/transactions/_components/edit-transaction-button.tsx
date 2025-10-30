"use client";

import { Button } from "@/app/_components/ui/button";
import UpsertOperationDialog from "@/app/_components/upsert-operation-dialog";
import { PencilIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { TransactionColumnData } from "../_columns";
import { upsertTransaction } from "@/app/_actions";
import { toast } from "sonner";
import { z } from "zod";
import { upsertTransactionSchema as formSchema } from "@/app/_actions/schema";

interface EditTransactionButtonProps {
  transaction: TransactionColumnData;
}

const EditTransactionButton = ({ transaction }: EditTransactionButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: z.infer<typeof formSchema>) => {
    console.log("Form data submitted:", formData);

    const dataForAction = {
      ...formData,
      assetType: transaction.asset.type,
    };

    startTransition(async () => {
      try {
        const result = await upsertTransaction(dataForAction);

        if (result?.success) {
          toast.success("Transação atualizada com sucesso!");
          setDialogIsOpen(false);
        } else {
          toast.error(
            "Falha ao atualizar a transação: O servidor retornou um erro inesperado.",
          );
          console.error(
            "Server action failed or returned unexpected result:",
            result,
          );
        }
      } catch (error) {
        console.error("Error during submit transition:", error);
        if (error instanceof Error) {
          toast.error(`Ocorreu um erro: ${error.message}`);
        } else {
          toast.error("Ocorreu um erro desconhecido ao atualizar a transação.");
        }
      }
    });
  };

  const defaultValuesForForm = {
    ...transaction,
    quantity: Number(transaction.quantity),
    unitPrice: Number(transaction.unitPrice),
    fees: Number(transaction.fees ?? 0),
    date: new Date(transaction.date),
    assetType: transaction.asset.type,
    operationType: transaction.operationType ?? undefined,
    retentionPeriod: transaction.retentionPeriod ?? undefined,
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        onClick={() => setDialogIsOpen(true)}
        disabled={isPending}
      >
        <PencilIcon className="h-4 w-4" />
      </Button>
      {dialogIsOpen && (
        <UpsertOperationDialog
          isOpen={dialogIsOpen}
          setIsOpen={setDialogIsOpen}
          onSubmit={handleSubmit}
          operationId={transaction.id}
          assetInfo={{
            assetId: transaction.assetId,
            symbol: transaction.asset.symbol,
            name: transaction.asset.symbol,
            type: transaction.asset.type,
          }}
          defaultValues={defaultValuesForForm}
        />
      )}
    </>
  );
};

export default EditTransactionButton;
