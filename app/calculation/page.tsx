// app/calculation/page.tsx
import { auth } from "@clerk/nextjs/server";
import Navbar from "../_components/navbar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../_components/ui/card";
import { CheckIcon, XIcon, FileText } from "lucide-react"; // Importe FileText
import { redirect } from "next/navigation";
import { AssetType } from "@prisma/client";
import TaxCalculatorButton from "./_components/calculation-button";
import UnifiedTaxCalculatorButton from "./_components/unified-calculation-button";

const SubscriptionPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  return (
    <>
      <Navbar />
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Cálculo de impostos</h1>

        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-stretch lg:justify-center">
          {/* Card Cripto */}
          <Card className="flex w-full max-w-sm flex-col justify-between">
            <div>
              <CardHeader className="mb-4 border-b border-solid py-8 text-center">
                {" "}
                <h2 className="text-xl font-semibold">
                  Cálculo de Criptomoeda
                </h2>
                <div className="mt-4">
                  <span className="text-6xl font-bold">15%</span>
                  <span className="ml-1 text-2xl text-gray-400">/lucro</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckIcon className="text-primary" />{" "}
                  <p>
                    <b>Nacional:</b> Isenção se o total de VENDAS no mês for
                    inferior a R$ 35.000 (em corretoras com CNPJ no Brasil).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon className="text-primary" />
                  <p>
                    <b>Exterior:</b> Tributação de 15% sobre o lucro (sem
                    isenção mensal). O imposto é apurado anualmente (AAI).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <XIcon className="mt-1 h-4 w-4 flex-shrink-0" />
                  <p>
                    Operações em corretoras estrangeiras{" "}
                    <b>não possuem isenção</b> de R$ 35k.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-md bg-muted p-2">
                  <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">
                      Atenção (DeCripto):
                    </span>{" "}
                    Se movimentar &gt; R$ 35.000/mês em corretoras estrangeiras
                    ou P2P, você é obrigado a declarar mensalmente no e-CAC,
                    mesmo se tiver prejuízo.
                  </p>
                </div>
              </CardContent>
            </div>
            <CardFooter>
              <TaxCalculatorButton assetType={AssetType.CRIPTO} />{" "}
            </CardFooter>
          </Card>

          {/* Card Ação */}
          <Card className="flex w-full max-w-sm flex-col justify-between">
            <div>
              <CardHeader className="mb-4 border-b border-solid py-8 text-center">
                <h2 className="text-xl font-semibold">Cálculo de Ação</h2>
                <div className="mt-4">
                  <span className="text-6xl font-bold">15%</span>
                  <span className="ml-1 text-2xl text-gray-400">/lucro</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckIcon className="text-primary" />{" "}
                  <p>0% sobre lucro de vendas até R$ 20.000 por mês.</p>
                </div>
                <div className="flex items-start gap-3">
                  <XIcon className="mt-1 h-4 w-4 flex-shrink-0" />
                  <p>15% sobre o lucro acima de R$ 20.000 no mês.</p>
                </div>
                <div className="flex items-start gap-3">
                  <XIcon className="mt-1 h-4 w-4 flex-shrink-0" />
                  <p>Day trade 20% sobre o lucro.</p>
                </div>
              </CardContent>
            </div>
            <CardFooter>
              <TaxCalculatorButton assetType={AssetType.ACAO} />{" "}
            </CardFooter>
          </Card>

          {/* Card FII */}
          <Card className="flex w-full max-w-sm flex-col justify-between">
            <div>
              <CardHeader className="mb-4 border-b border-solid py-8 text-center">
                <h2 className="text-xl font-semibold">
                  Cálculo de Fundos Imobiliários
                </h2>
                <div className="mt-4">
                  <span className="text-6xl font-bold">20%</span>
                  <span className="ml-1 text-2xl text-gray-400">/lucro</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckIcon className="text-primary" />
                  <p>
                    20% sobre o lucro na <b>Venda</b> (Swing Trade ou Day
                    Trade).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon className="text-primary" />
                  <p>Rendimentos (aluguéis) mensais são isentos de IR.</p>
                </div>
                <div className="flex items-start gap-3">
                  <XIcon className="mt-1 h-4 w-4 flex-shrink-0" />
                  <p>
                    Não há limite de isenção para vendas (qualquer lucro é
                    tributado).
                  </p>
                </div>
              </CardContent>
            </div>
            <CardFooter>
              <TaxCalculatorButton assetType={AssetType.FII} />{" "}
            </CardFooter>
          </Card>

          {/* Card Unificado (Destaque) */}
          <Card className="flex w-full max-w-sm flex-col justify-between border-2 border-primary">
            <div>
              <CardHeader className="mb-4 border-b border-solid py-8 text-center">
                <h2 className="text-xl font-semibold">
                  Relatório Mensal Unificado
                </h2>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <FileText className="h-12 w-12 text-primary" />
                  <span className="text-4xl font-bold">Todos os Ativos</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckIcon className="text-primary" />
                  <p>
                    Gera um <b>único PDF</b> contendo o cálculo separado de
                    Ações, FIIs e Criptomoedas para o mês atual.
                  </p>
                </div>
              </CardContent>
            </div>
            <CardFooter>
              <UnifiedTaxCalculatorButton />
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};
export default SubscriptionPage;
