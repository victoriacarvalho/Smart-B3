"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { SearchIcon } from "lucide-react";
import { AssetSearchDialog } from "./AssetSearchDialog";

export function AssetSearchIcon() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
        aria-label="Buscar Ativo"
      >
        <SearchIcon className="h-5 w-5" />
      </Button>
      <AssetSearchDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} />
    </>
  );
}
