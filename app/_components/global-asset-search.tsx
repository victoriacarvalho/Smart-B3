// app/_components/global-asset-search.tsx
"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Asset, AssetType } from "@prisma/client";
import { Search } from "lucide-react";
import { Button } from "./ui/button";
import {
  CommandDialog,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./ui/command";
import AssetTypeIcon from "@/app/(home)/_components/asset-type-icon";
import { findOrCreateAsset } from "@/app/_actions";
import { toast } from "sonner";

type PortfolioAsset = Pick<Asset, "id" | "symbol" | "type">;

type StockApiResult = {
  symbol: string;
  name: string;
  type: AssetType;
};

type CryptoApiResult = {
  apiId: string;
  symbol: string;
  name: string;
  type: "CRIPTO";
};

type SearchResult = {
  symbol: string;
  name: string;
  type: AssetType;
  apiId?: string;
};

export function GlobalAssetSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/portfolio")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0 && data[0].assets) {
          setPortfolioAssets(data[0].assets);
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar ativos da carteira:", err);
        toast.error("Erro ao buscar seus ativos da carteira.");
      });
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      Promise.all([
        fetch(`/api/assets/search-stocks?q=${query}`).then((res) => res.json()),
        fetch(`/api/assets/search-crypto?q=${query}`).then((res) => res.json()),
      ])
        .then(([stockResults = [], cryptoResults = []]) => {
          const formattedStockResults: SearchResult[] = stockResults.map(
            (stock: StockApiResult) => ({
              ...stock,
              type: stock.symbol.endsWith("11")
                ? AssetType.FII
                : AssetType.ACAO,
            }),
          );

          const formattedCryptoResults: SearchResult[] = cryptoResults.map(
            (crypto: CryptoApiResult) => ({
              ...crypto,
              type: AssetType.CRIPTO,
              name: crypto.name || crypto.symbol,
            }),
          );

          setSearchResults([
            ...formattedStockResults,
            ...formattedCryptoResults,
          ]);
        })
        .catch((err) => {
          console.error("Erro ao buscar novos ativos:", err);
          toast.error("Erro ao buscar novos ativos. Tente novamente.");
          setSearchResults([]);
        })
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectPortfolioAsset = useCallback(
    (assetId: string) => {
      router.push(`/investment/${assetId}`);
      setIsOpen(false);
      setQuery("");
    },
    [router],
  );

  const handleSelectNewAsset = useCallback(
    (result: SearchResult) => {
      startTransition(async () => {
        try {
          const symbolToSave = result.apiId || result.symbol;

          const dbAsset = await findOrCreateAsset({
            symbol: symbolToSave,
            type: result.type,
          });

          router.push(`/investment/${dbAsset.id}`);
          setIsOpen(false);
          setQuery("");
        } catch (error) {
          console.error("Erro ao criar/buscar ativo:", error);
          toast.error("Erro ao buscar o ativo. Tente novamente.");
        }
      });
    },
    [router],
  );

  const portfolioSymbols = new Set(
    portfolioAssets.map((a) => a.symbol.toUpperCase()),
  );

  return (
    <>
      <Button
        variant="outline"
        className="h-10 w-10 p-0 md:w-[200px] md:justify-start md:px-3 md:py-2"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4 md:mr-2" />
        <span className="hidden text-sm text-muted-foreground md:inline-flex">
          Pesquisar ativo...
        </span>
      </Button>

      <CommandDialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setQuery("");
            setSearchResults([]);
          }
        }}
      >
        <CommandInput
          placeholder="Pesquisar por símbolo (ex: PETR4, BTC)..."
          value={query}
          onValueChange={setQuery}
          disabled={isPending}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? "Buscando..." : "Nenhum resultado encontrado."}
          </CommandEmpty>

          {isPending && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando ativo...
            </div>
          )}

          <CommandGroup heading="Meus Ativos">
            {portfolioAssets.map((asset) => (
              <CommandItem
                key={asset.id}
                value={`${asset.symbol} ${asset.type}`}
                onSelect={() => handleSelectPortfolioAsset(asset.id)}
                className="cursor-pointer"
                disabled={isPending}
              >
                <AssetTypeIcon type={asset.type} className="h-4 w-4" />
                <span className="font-medium">
                  {asset.symbol.toUpperCase()}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {asset.type}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          {searchResults.length > 0 && (
            <CommandGroup heading="Resultados da Busca">
              {searchResults
                .filter(
                  (result) =>
                    !portfolioSymbols.has(
                      (result.apiId || result.symbol).toUpperCase(),
                    ),
                )
                .map((result) => (
                  <CommandItem
                    key={result.apiId || result.symbol}
                    value={`${result.symbol} ${result.name} ${result.type}`}
                    onSelect={() => handleSelectNewAsset(result)}
                    className="cursor-pointer"
                    disabled={isPending}
                  >
                    <AssetTypeIcon type={result.type} className="h-4 w-4" />
                    <span className="font-medium">
                      {result.symbol.toUpperCase()}
                    </span>
                    <span className="ml-2 truncate text-xs text-muted-foreground">
                      {result.name}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
