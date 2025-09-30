"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Asset, AssetType } from "@prisma/client";
import { toast } from "sonner";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { AssetSearch } from "./AssetSearch";
import { ASSET_TYPE_OPTIONS } from "../_constants/transactions";
import UpsertTransactionDialog from "./upsert-transaction-dialog";

// Verifique se este caminho está correto para sua estrutura de pastas
import { findOrCreateAsset, upsertTransaction } from "@/app/_actions";

type SelectedAsset = {
  symbol: string;
  name: string;
  apiId?: string;
};

export function AddTransactionDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);

  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(
    null,
  );
  const [activeAsset, setActiveAsset] = useState<SelectedAsset | null>(null);

  const [dbAsset, setDbAsset] = useState<Asset | null>(null);
  const [assetPrice, setAssetPrice] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleAssetSelection = async (asset: SelectedAsset) => {
    setActiveAsset(asset);
    setIsLoadingData(true);
    const loadingToast = toast.loading("Buscando dados do ativo...");

    try {
      const foundAsset = await findOrCreateAsset({
        symbol: asset.symbol,
        type: selectedAssetType!,
      });
      setDbAsset(foundAsset);

      const symbolToFetch =
        foundAsset.type === "CRIPTO" ? asset.apiId! : foundAsset.symbol;
      const priceResponse = await fetch(
        `/api/assets/price?symbol=${symbolToFetch}&type=${foundAsset.type}`,
      );
      if (!priceResponse.ok)
        throw new Error("Não foi possível buscar o preço.");

      const priceData = await priceResponse.json();
      setAssetPrice(priceData.price);

      toast.dismiss(loadingToast);
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error("Erro ao buscar dados do ativo. Tente novamente.");
      setActiveAsset(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleProceedToForm = () => {
    // Apenas gerencia a transição entre os modais
    setIsSelectionOpen(false);
    setIsUpsertOpen(true);
  };

  const handleSubmitTransaction = async (data: any) => {
    startTransition(async () => {
      try {
        await upsertTransaction(data);
        toast.success("Transação salva com sucesso!");
        setIsUpsertOpen(false); // Fechar o formulário vai acionar o onOpenChange dele
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Falha ao salvar a transação.");
      }
    });
  };

  const handleReset = () => {
    // Esta função agora é chamada de forma segura
    setIsSelectionOpen(false);
    setSelectedAssetType(null);
    setActiveAsset(null);
    setDbAsset(null);
    setAssetPrice(null);
  };

  return (
    <>
      <Dialog
        open={isSelectionOpen}
        onOpenChange={(open) => {
          // O reset só acontece se o usuário fechar o modal de seleção manualmente
          setIsSelectionOpen(open);
          if (!open) {
            handleReset();
          }
        }}
      >
        <DialogTrigger asChild>
          <Button onClick={() => setIsSelectionOpen(true)}>
            Adicionar Transação
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Transação</DialogTitle>
            <DialogDescription>
              Primeiro, selecione o tipo e o ativo para continuar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Tipo de ativo</label>
              <Select
                onValueChange={(value: AssetType) => {
                  setSelectedAssetType(value);
                  setActiveAsset(null);
                  setDbAsset(null);
                  setAssetPrice(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedAssetType === AssetType.ACAO ||
              selectedAssetType === AssetType.FII) && (
              <AssetSearch
                searchEndpoint="/api/assets/search"
                placeholder="Buscar Ação/FII..."
                onAssetSelect={handleAssetSelection}
              />
            )}
            {selectedAssetType === AssetType.CRIPTO && (
              <AssetSearch
                searchEndpoint="/api/assets/search-crypto"
                placeholder="Buscar Criptomoeda..."
                onAssetSelect={handleAssetSelection}
              />
            )}

            {activeAsset && (
              <div className="space-y-4 border-t pt-4">
                <div className="rounded-lg border bg-muted p-3 text-sm">
                  <p>
                    <strong>Símbolo:</strong> {activeAsset.symbol.toUpperCase()}
                  </p>
                  <p>
                    <strong>Preço Atual:</strong>{" "}
                    {isLoadingData
                      ? "Buscando..."
                      : assetPrice
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(assetPrice)
                        : "N/A"}
                  </p>
                </div>
                <Button
                  onClick={handleProceedToForm}
                  className="w-full"
                  disabled={isLoadingData || !assetPrice}
                >
                  {isLoadingData
                    ? "Carregando Dados..."
                    : `Registrar Transação`}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* =================================================================== */}
      {/* CORREÇÃO: A lógica de reset foi movida para o onOpenChange do 2º diálogo */}
      {/* =================================================================== */}
      {dbAsset && assetPrice && (
        <UpsertTransactionDialog
          isOpen={isUpsertOpen}
          // Em vez de 'setIsOpen', usamos uma função que reseta tudo ao fechar
          onOpenChange={(open) => {
            setIsUpsertOpen(open);
            if (!open) {
              // Quando o formulário fecha, por qualquer motivo, o fluxo acabou. Resetamos tudo.
              handleReset();
            }
          }}
          onSubmit={handleSubmitTransaction}
          assetId={dbAsset.id}
          assetType={dbAsset.type}
          assetSymbol={dbAsset.symbol}
          assetName={activeAsset?.name ?? ""}
          initialUnitPrice={assetPrice}
        />
      )}
    </>
  );
}
