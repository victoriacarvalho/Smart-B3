"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssetType } from "@prisma/client";
import { findOrCreateAsset } from "@/app/_actions";
import { AssetSearch } from "./AssetSearch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ASSET_TYPE_OPTIONS } from "../_constants/transactions";

type SearchResult = {
  symbol: string;
  name: string;
  apiId?: string;
};

export function AssetPageSearch() {
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(
    null,
  );
  const [isFindingAsset, setIsFindingAsset] = useState(false);
  const router = useRouter();

  const handleAssetSelection = async (asset: SearchResult) => {
    if (!selectedAssetType) return;

    setIsFindingAsset(true);

    try {
      const dbAsset = await findOrCreateAsset({
        symbol: asset.apiId || asset.symbol,
        type: selectedAssetType,
      });

      if (dbAsset && dbAsset.id) {
        router.push(`/investment/${dbAsset.id}`);
      }
    } catch (error) {
      console.error("Erro ao buscar ou criar o ativo:", error);
      // Aqui você pode adicionar um toast de erro para o usuário
    } finally {
      setIsFindingAsset(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Buscar Ativo</h2>
      <p className="text-sm text-muted-foreground">
        Selecione o tipo e depois busque pelo símbolo ou nome do ativo.
      </p>

      <Select onValueChange={(value: AssetType) => setSelectedAssetType(value)}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Selecione o tipo de ativo..." />
        </SelectTrigger>
        <SelectContent>
          {ASSET_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedAssetType && (
        <>
          {selectedAssetType === AssetType.ACAO ||
          selectedAssetType === AssetType.FII ? (
            <AssetSearch
              searchEndpoint="/api/assets/search-stocks"
              placeholder="Buscar Ação/FII..."
              onAssetSelect={handleAssetSelection}
            />
          ) : (
            <AssetSearch
              searchEndpoint="/api/assets/search-crypto"
              placeholder="Buscar Criptomoeda..."
              onAssetSelect={handleAssetSelection}
            />
          )}
        </>
      )}

      {isFindingAsset && (
        <p className="animate-pulse text-sm text-muted-foreground">
          Buscando informações do ativo...
        </p>
      )}
    </div>
  );
}
