"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import UpsertTransactionDialog from "./upsert-transaction-dialog";
import { AssetType } from "@prisma/client";

interface AddTransactionButtonProps {
  activeAsset: {
    symbol: string;
    name: string;
  };
  assetType: AssetType;
}

const AddTransactionButton = ({
  activeAsset,
  assetType,
}: AddTransactionButtonProps) => {
  const [dialogOpen, setDialogIsOpen] = useState(false);

  const handleSubmitTransaction = async (data: any) => {
    console.log("Submitting transaction:", data);
    // Sua lógica para salvar no banco de dados vai aqui
  };

  return (
    <>
      <Button
        className="mt-4 rounded-full font-bold"
        onClick={() => setDialogIsOpen(true)}
      >
        Adicionar transação
      </Button>
      <UpsertTransactionDialog
        isOpen={dialogOpen}
        setIsOpen={setDialogIsOpen}
        onSubmit={handleSubmitTransaction}
        assetSymbol={activeAsset.symbol}
        assetName={activeAsset.name}
        assetType={assetType}
      />
    </>
  );
};

export default AddTransactionButton;
