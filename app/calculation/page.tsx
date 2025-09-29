"use client";

import { AssetSearch } from "../_components/AssetSearch";

import { useState } from "react";

// Tipo genérico para podermos usar para ambos
type SelectedAsset = {
  symbol: string;
  name: string;
};

export default function AddTransactionPage() {
  const [selectedStock, setSelectedStock] = useState<SelectedAsset | null>(
    null,
  );
  const [selectedCrypto, setSelectedCrypto] = useState<SelectedAsset | null>(
    null,
  );

  // Lógica para decidir qual ativo está "ativo" no formulário
  const activeAsset = selectedStock || selectedCrypto;

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Adicionar Nova Transação</h1>
      <p className="mb-6 text-muted-foreground">
        Selecione uma Ação/FII ou uma Criptomoeda para continuar.
      </p>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Campo de Busca para Ações e FIIs */}
        <div className="flex flex-col gap-2">
          <label className="font-medium">Ações e FIIs</label>
          <AssetSearch
            searchEndpoint="/api/assets/search-stocks"
            placeholder="Buscar Ação/FII..."
            onAssetSelect={(asset) => {
              setSelectedStock(asset);
              setSelectedCrypto(null); // Limpa a outra seleção
            }}
          />
        </div>

        {/* Campo de Busca para Criptomoedas */}
        <div className="flex flex-col gap-2">
          <label className="font-medium">Criptomoedas</label>
          <AssetSearch
            searchEndpoint="/api/assets/search-crypto"
            placeholder="Buscar Criptomoeda..."
            onAssetSelect={(asset) => {
              setSelectedCrypto(asset);
              setSelectedStock(null); // Limpa a outra seleção
            }}
          />
        </div>
      </div>

      {activeAsset && (
        <div className="mt-8 border-t pt-6">
          <h2 className="mb-4 text-xl font-semibold">
            Registrar Transação para: {activeAsset.symbol.toUpperCase()}
          </h2>
          <div className="rounded-lg border bg-muted p-4">
            <p>
              <strong>Símbolo:</strong> {activeAsset.symbol.toUpperCase()}
            </p>
            <p>
              <strong>Nome:</strong> {activeAsset.name}
            </p>
          </div>
          {/* ... Aqui viriam os outros campos do formulário: quantidade, preço, data, tipo (compra/venda), etc ... */}
        </div>
      )}
    </div>
  );
}
