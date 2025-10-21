import { auth } from "@clerk/nextjs/server";
import Navbar from "../_components/navbar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../_components/ui/card";
import { CheckIcon, XIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { AssetType } from "@prisma/client";
import TaxCalculatorButton from "./_components/calculation-button";

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

        <div className="flex justify-center gap-6">
          <Card className="flex w-[550px] w-full max-w-sm flex-col justify-between">
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
                  <p>Isenção para lucros até R$ 35.000</p>
                </div>
                <div className="flex items-start gap-3">
                  <XIcon className="mt-1 h-4 w-4 flex-shrink-0" />
                  <p>Tributação p/ lucros acima de R$ 35.000</p>
                </div>
                <div className="flex items-start gap-3">
                  <XIcon className="mt-1 h-4 w-4 flex-shrink-0" />
                  <p>Considerando lucros MENSAIS</p>
                </div>
              </CardContent>
            </div>
            <CardFooter>
              <TaxCalculatorButton assetType={AssetType.CRIPTO} />{" "}
            </CardFooter>
          </Card>

          {/* Card 2: Ação */}
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

          {/* Card 3: Fundos Imobiliários */}
          <Card className="flex w-full max-w-sm flex-col justify-between">
            <div>
              <CardHeader className="mb-4 border-b border-solid py-8 text-center">
                <h2 className="text-xl font-semibold">
                  Cálculo de Fundos Imobiliários
                </h2>
                <div className="mt-4">
                  <span className="text-6xl font-bold">15%</span>
                  <span className="ml-1 text-2xl text-gray-400">/lucro</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <XIcon className="mt-1 h-4 w-4 flex-shrink-0" />
                  <p>Fundos de ações: 15% sobre o lucro no resgate.</p>
                </div>
                <div className="flex items-start gap-3">
                  <XIcon className="mt-1 h-4 w-4 flex-shrink-0" />
                  <p>
                    Fundos de renda fixa multimercado usam tabela regressiva de
                    alíquota
                  </p>
                </div>
              </CardContent>
            </div>
            <CardFooter>
              <TaxCalculatorButton assetType={AssetType.FII} />{" "}
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};
export default SubscriptionPage;
