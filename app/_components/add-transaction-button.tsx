/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { startTransition, useState } from "react";
import { AssetType } from "@prisma/client";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

import { ASSET_TYPE_OPTIONS } from "../_constants/transactions";
import UpsertTransactionDialog from "./upsert-operation-dialog";
import { findOrCreateAsset, upsertTransaction } from "../_actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { AssetSearch } from "./asset-search";

type SearchResult = {
  symbol: string;
  name: string;
  apiId?: string;
};

type ActiveAsset = {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  apiId?: string;
};

export function AddTransactionDialog() {
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(
    null,
  );
  const [activeAsset, setActiveAsset] = useState<ActiveAsset | null>(null);
  const [isFindingAsset, setIsFindingAsset] = useState(false);

  const handleReset = () => {
    setIsSelectionOpen(false);
    setIsUpsertOpen(false);
    setSelectedAssetType(null);
    setActiveAsset(null);
  };

  const handleAssetSelection = async (asset: SearchResult) => {
    if (!selectedAssetType) return;

    setIsFindingAsset(true);
    startTransition(async () => {
      try {
        const portfolioResponse = await fetch("/api/portfolio");
        if (!portfolioResponse.ok) {
          throw new Error("Falha ao obter a carteira do usuário.");
        }

        const portfolios = await portfolioResponse.json();
        const portfolioId = portfolios[0]?.id;

        if (!portfolioId) {
          throw new Error("Não foi possível identificar a carteira principal.");
        }

        const dbAsset = await findOrCreateAsset({
          symbol: (asset as any).apiId || asset.symbol,
          type: selectedAssetType,
        });

        setActiveAsset({
          id: dbAsset.id,
          symbol: asset.symbol.toUpperCase(),
          name: asset.name,
          type: dbAsset.type,
          apiId: asset.apiId,
        });
      } catch (error) {
        console.error("Erro no fluxo de seleção de ativo:", error);
      } finally {
        setIsFindingAsset(false);
      }
    });
  };
  const handleProceedToForm = () => {
    if (!activeAsset) return;
    setIsSelectionOpen(false);
    setIsUpsertOpen(true);
  };

  const handleSubmitTransaction = async (data: any) => {
    startTransition(async () => {
      try {
        await upsertTransaction(data);
        handleReset();
      } catch (error) {
        console.error("Erro ao salvar transação:", error);
      }
    });
  };

  return (
    <>
      <Dialog
        open={isSelectionOpen}
        onOpenChange={(open) => {
          setIsSelectionOpen(open);
          if (!open) handleReset();
        }}
      >
        <DialogTrigger asChild>
          <Button>Adicionar Transação</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Transação</DialogTitle>
            <DialogDescription>
              Selecione o tipo e o ativo para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo de ativo</label>
              <Select
                onValueChange={(value: AssetType) => {
                  setSelectedAssetType(value);
                  setActiveAsset(null);
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
                searchEndpoint="/api/assets/search-stocks"
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

            {isFindingAsset && (
              <p className="text-sm text-muted-foreground">
                Verificando ativo...
              </p>
            )}

            {activeAsset && !isFindingAsset && (
              <div className="space-y-4 border-t pt-4">
                <div className="rounded-lg border bg-muted p-3 text-sm">
                  <p>
                    <strong>Símbolo:</strong> {activeAsset.symbol}
                  </p>
                  <p>
                    <strong>Nome:</strong> {activeAsset.name}
                  </p>
                </div>
                <Button onClick={handleProceedToForm} className="w-full">
                  Registrar Transação para {activeAsset.symbol}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isUpsertOpen && activeAsset && selectedAssetType && (
        <UpsertTransactionDialog
          isOpen={isUpsertOpen}
          setIsOpen={setIsUpsertOpen}
          onSubmit={handleSubmitTransaction}
          assetInfo={{
            assetId: activeAsset.id,
            symbol: activeAsset.symbol,
            name: activeAsset.name,
            type: activeAsset.type,
            apiId: activeAsset.apiId,
          }}
        />
      )}
    </>
  );
}
