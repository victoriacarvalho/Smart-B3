"use client";

import { useState } from "react";
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

type SelectedAsset = {
  symbol: string;
  name: string;
};

export function AddTransactionDialog() {
  // Estado para o diálogo principal de seleção
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  // Estado para o diálogo final de preenchimento do formulário
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);

  // Estados para controlar a seleção dentro do diálogo
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(
    null,
  );
  const [activeAsset, setActiveAsset] = useState<SelectedAsset | null>(null);

  // Função para resetar tudo ao fechar
  const handleReset = () => {
    setIsSelectionOpen(false);
    setSelectedAssetType(null);
    setActiveAsset(null);
  };

  // Função para avançar para o próximo passo (abrir formulário)
  const handleProceedToForm = () => {
    setIsSelectionOpen(false); // Fecha o modal de seleção
    setIsUpsertOpen(true); // Abre o modal de formulário
  };

  const handleSubmitTransaction = async (data: any) => {
    console.log("Salvando transação:", data);
    // Aqui viria sua lógica para salvar no banco de dados
  };

  return (
    <>
      <Dialog
        open={isSelectionOpen}
        onOpenChange={(open) => !open && handleReset()}
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

          {/* ----- Conteúdo da antiga página, agora dentro do modal ----- */}
          <div className="space-y-4">
            {/* 1. SELEÇÃO DE TIPO DE ATIVO */}
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

            {/* 2. BUSCA CONDICIONAL DE ATIVO */}
            {(selectedAssetType === AssetType.ACAO ||
              selectedAssetType === AssetType.FII) && (
              <AssetSearch
                searchEndpoint="/api/assets/search-stocks"
                placeholder="Buscar Ação/FII..."
                onAssetSelect={(asset) => setActiveAsset(asset)}
              />
            )}
            {selectedAssetType === AssetType.CRIPTO && (
              <AssetSearch
                searchEndpoint="/api/assets/search-crypto"
                placeholder="Buscar Criptomoeda..."
                onAssetSelect={(asset) => setActiveAsset(asset)}
              />
            )}

            {/* 3. EXIBIÇÃO DO ATIVO E BOTÃO PARA AVANÇAR */}
            {activeAsset && (
              <div className="space-y-4 border-t pt-4">
                <div className="rounded-lg border bg-muted p-3 text-sm">
                  <p>
                    <strong>Símbolo:</strong> {activeAsset.symbol.toUpperCase()}
                  </p>
                  <p>
                    <strong>Nome:</strong> {activeAsset.name}
                  </p>
                </div>
                <Button onClick={handleProceedToForm} className="w-full">
                  Registrar Transação para {activeAsset.symbol.toUpperCase()}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* O segundo diálogo (formulário) é controlado separadamente */}
      {activeAsset && selectedAssetType && (
        <UpsertTransactionDialog
          isOpen={isUpsertOpen}
          setIsOpen={setIsUpsertOpen}
          onSubmit={handleSubmitTransaction}
          assetSymbol={activeAsset.symbol}
          assetName={activeAsset.name}
          assetType={selectedAssetType}
        />
      )}
    </>
  );
}
