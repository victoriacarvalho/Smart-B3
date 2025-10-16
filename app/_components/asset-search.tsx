"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { cn } from "../_lib/utils";

type SearchResult = {
  symbol: string;
  name: string;
};

interface AssetSearchProps {
  searchEndpoint: "/api/assets/search-stocks" | "/api/assets/search-crypto";
  placeholder: string;
  onAssetSelect: (asset: SearchResult) => void;
}

export function AssetSearch({
  searchEndpoint,
  placeholder,
  onAssetSelect,
}: AssetSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState("");

  React.useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(() => {
      fetch(`${searchEndpoint}?q=${query}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data);
          setIsLoading(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchEndpoint]);

  const handleSelect = (asset: SearchResult) => {
    const displayValue = `${asset.name} (${asset.symbol.toUpperCase()})`;
    setSelectedValue(displayValue);
    onAssetSelect(asset);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {selectedValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={placeholder} onValueChange={setQuery} />
          <CommandList>
            {isLoading && (
              <div className="p-2 text-center text-sm">Buscando...</div>
            )}
            <CommandEmpty>Nenhum ativo encontrado.</CommandEmpty>
            <CommandGroup>
              {results.map((asset) => (
                <CommandItem
                  key={`${asset.symbol}-${asset.name}`}
                  value={`${asset.name} ${asset.symbol}`}
                  onSelect={() => handleSelect(asset)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValue.includes(`(${asset.symbol.toUpperCase()})`)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <div>
                    <p className="font-bold">{asset.symbol.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {asset.name}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
