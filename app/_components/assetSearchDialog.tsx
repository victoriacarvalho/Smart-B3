"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssetType } from "@prisma/client";
import { findOrCreateAsset } from "@/app/_actions";
import { AssetSearch } from "./AssetSearch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
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

interface AssetSearchDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function AssetSearchDialog({
  isOpen,
  setIsOpen,
}: AssetSearchDialogProps) {
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
        setIsOpen(false);
        router.push(`/investment/${dbAsset.id}`);
      }
    } catch (error) {
      console.error("Erro ao buscar ou criar o ativo:", error);
    } finally {
      setIsFindingAsset(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buscar Ativo</DialogTitle>
          <DialogDescription>
            Selecione o tipo e depois busque pelo símbolo ou nome do ativo para
            ver os detalhes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Select
            onValueChange={(value: AssetType) => setSelectedAssetType(value)}
          >
            <SelectTrigger>
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
              Buscando...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
