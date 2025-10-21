"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssetType } from "@prisma/client";

import { calculateTax } from "@/app/calculation/_actions/calculates-taxes";
import { toast } from "sonner";
import { Button } from "@/app/_components/ui/button";

export default function TaxCalculatorButton({
  assetType,
}: {
  assetType: AssetType;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const response = await calculateTax(assetType);

      if (response.success) {
        toast.success("Sucesso!", { description: response.message });
        router.push("/reports");
        router.refresh();
      } else {
        toast.info("Atenção", { description: response.message });
      }
    } catch {
      toast.error("Erro", {
        description: "Não foi possível processar a solicitação.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCalculate}
      disabled={isLoading}
      variant="outline"
      className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
    >
      {isLoading ? "Processando..." : "Gerar Relatório de Imposto"}
    </Button>
  );
}
