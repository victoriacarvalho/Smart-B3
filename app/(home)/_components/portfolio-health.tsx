import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress"; // Verifique se o caminho está certo
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface PortfolioHealthProps {
  totalEquity: number; // Mudamos para receber o Total Geral direto
  cryptoTotal: number;
}

export function PortfolioHealth({ totalEquity, cryptoTotal }: PortfolioHealthProps) {
  // Se o total for zero, não exibe nada para evitar divisão por zero
  if (!totalEquity || totalEquity === 0) return null;

  const cryptoPercentage = (cryptoTotal / totalEquity) * 100;

  // Regra: Acima de 20% é considerado risco alto (ajuste conforme preferir)
  const isRisky = cryptoPercentage > 20;

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Saúde da Carteira</CardTitle>
        {isRisky ? (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        ) : (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Exposição em Cripto</span>
            <span className={`font-bold ${isRisky ? "text-amber-500" : "text-emerald-500"}`}>
              {cryptoPercentage.toFixed(1)}%
            </span>
          </div>
          
          {/* A classe [&>div] pinta a barra interna do componente Progress */}
          <Progress 
            value={cryptoPercentage} 
            className={`h-2 [&>div]:${isRisky ? "bg-amber-500" : "bg-emerald-500"}`} 
          />
          
          <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5" />
            <p>
              {isRisky 
                ? "Sua exposição em criptoativos está alta (>20%). Considere rebalancear."
                : "Sua carteira está equilibrada com exposição controlada."
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}