import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { CopyIcon } from "lucide-react";
import Navbar from "@/app/_components/navbar";
import { formatCurrency } from "@/app/_utils/currency";

export default async function IrpfReportPage() {
  const { userId } = auth();
  if (!userId) return null;


  const assets = await db.asset.findMany({
    where: { 
      portfolio: { userId },
      quantity: { gt: 0 }
    },
    include: { portfolio: true }
  });

  return (
    <>
      <Navbar />
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Gerador de Declaração Anual (Bens e Direitos)</h1>
        <div className="grid gap-4">
          {assets.map((asset) => {
            const totalCost = Number(asset.quantity) * Number(asset.averagePrice);
            const declarationText = `${asset.type}: ${asset.quantity.toString()} unidades de ${asset.symbol}, adquiridas pelo custo médio de ${formatCurrency(Number(asset.averagePrice))}. Custo Total: ${formatCurrency(totalCost)}. Custódia: ${asset.isForeign ? "Exterior" : "Brasil"}.`;

            return (
              <Card key={asset.id}>
                <CardHeader className="flex flex-row items-center justify-between py-2">
                  <CardTitle className="text-base">{asset.symbol}</CardTitle>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CopyIcon className="w-4 h-4" /> Copiar
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {declarationText}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}