// app/calculation/_components/unified-calculation-button.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculateUnifiedDarf } from "@/app/calculation/_actions/calculates-taxes";
import { toast } from "sonner";
import { Button } from "@/app/_components/ui/button";
import { FileText } from "lucide-react";

export default function UnifiedTaxCalculatorButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      // Chama a nova action unificada
      const response = await calculateUnifiedDarf();

      if (response.success) {
        toast.success("Sucesso!", { description: response.message });
        router.push("/reports?view=mes"); // Direciona para a nova view
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
      variant="default" // Dar mais destaque
      className="w-full"
    >
      {isLoading ? (
        "Processando..."
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Gerar Relatório Unificado
        </>
      )}
    </Button>
  );
}
