// app/calculation/_components/TaxCalculatorButton.tsx

"use client";

import { useState } from "react";
import { calculateTax } from "@/app/calculation/_actions/calculates-taxes"; // Importa a Server Action
import { Button } from "@/app/_components/ui/button";
import { AssetType } from "@prisma/client";

// Define o tipo para o resultado, para usar com o state
type TaxResult = {
  tax: number;
  message: string;
};

interface TaxCalculatorButtonProps {
  assetType: AssetType;
}

export default function TaxCalculatorButton({
  assetType,
}: TaxCalculatorButtonProps) {
  const [result, setResult] = useState<TaxResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await calculateTax(assetType);
      setResult(response);
    } catch (err) {
      setError("Ocorreu um erro ao calcular. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <Button
        onClick={handleCalculate}
        disabled={isLoading}
        variant="outline"
        className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
      >
        {isLoading ? "Calculando..." : "Calcular Imposto Mensal"}
      </Button>

      {result && (
        <div className="mt-4 rounded-md border border-gray-600 bg-gray-800 p-4 text-center text-sm">
          <p className="text-gray-300">{result.message}</p>
          <p className="mt-2 text-lg font-bold text-white">
            Imposto a Pagar:{" "}
            <span className="text-primary">R$ {result.tax.toFixed(2)}</span>
          </p>
        </div>
      )}
      {error && (
        <p className="mt-2 text-center text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
