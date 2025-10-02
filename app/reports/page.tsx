import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/_lib/prisma";
import Link from "next/link";
import { DownloadIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import Navbar from "../_components/navbar";

const assetTypeNames = {
  ACAO: "Ações",
  FII: "Fundos Imobiliários",
  CRIPTO: "Criptomoedas",
};

export default async function ReportsPage() {
  const { userId } = auth();
  if (!userId) redirect("/login");

  const darfs = await db.darf.findMany({
    where: { userId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return (
    <>
      <Navbar />
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Relatórios gerados</h1>
        <Card className="border-none bg-[#1C1C1C]">
          <CardHeader>
            <CardTitle>Histórico de DARFS</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-800">
                  <TableHead className="text-white">Competência</TableHead>
                  <TableHead className="text-white">Ativo</TableHead>
                  <TableHead className="text-right text-white">
                    Valor (R$)
                  </TableHead>
                  <TableHead className="text-center text-white">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-white">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {darfs.length > 0 ? (
                  darfs.map((darf) => (
                    <TableRow
                      key={darf.id}
                      className="border-gray-700 hover:bg-gray-800"
                    >
                      <TableCell>
                        {String(darf.month).padStart(2, "0")}/{darf.year}
                      </TableCell>
                      <TableCell>{assetTypeNames[darf.assetType]}</TableCell>
                      <TableCell className="text-right">
                        {Number(darf.taxDue).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={darf.isPaid ? "default" : "destructive"}
                        >
                          {darf.isPaid ? "Pago" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-primary text-primary hover:bg-primary hover:text-white"
                        >
                          <Link href={darf.pdfUrl} target="_blank" download>
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Ver PDF
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-gray-400"
                    >
                      Nenhum relatório de imposto foi gerado ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
