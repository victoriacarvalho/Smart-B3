"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { BotIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import Link from "next/link";
// Importe a nova action que criamos
import { generateAiReportFromPortfolio } from "@/app/_actions/report.actions";
// Importe os renderizadores de Markdown
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AiReportButtonProps {
  isPremium?: boolean; // Você pode controlar isso via props
}

// Vamos assumir 'true' por padrão para testes
const AiReportButton = ({ isPremium = true }: AiReportButtonProps) => {
  const [report, setReport] = useState<string | null>(null);
  const [reportIsLoading, setReportIsLoading] = useState(false);

  const handleGenerateReportClick = async () => {
    try {
      setReportIsLoading(true);
      // Chama a nova Server Action
      const generatedReport = await generateAiReportFromPortfolio();
      setReport(generatedReport);
    } catch (error) {
      console.error(error);
      setReport(
        "Ocorreu um erro ao conectar com o serviço de IA. Por favor, tente novamente.",
      );
    } finally {
      setReportIsLoading(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setReport(null); // Limpa o relatório ao fechar
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          Relatório IA
          <BotIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        {isPremium ? (
          <>
            <DialogHeader>
              <DialogTitle>Relatório de Carteira com IA</DialogTitle>
              <DialogDescription>
                Use a IA para gerar um relatório com insights sobre sua carteira
                atual.
              </DialogDescription>
            </DialogHeader>

            {/* Área de Scroll para exibir o relatório */}
            <ScrollArea className="prose prose-sm dark:prose-invert max-h-[500px] rounded-md border p-4">
              {reportIsLoading ? (
                // Estado de Carregamento
                <div className="flex h-48 flex-col items-center justify-center gap-4 text-center">
                  <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
                  <p className="font-medium">Analisando sua carteira...</p>
                  <p className="text-xs text-muted-foreground">
                    Isso pode levar alguns segundos.
                  </p>
                </div>
              ) : report ? (
                // Estado com Relatório
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {report}
                </ReactMarkdown>
              ) : (
                // Estado Inicial
                <div className="flex h-48 flex-col items-center justify-center gap-4 text-center">
                  <SparklesIcon className="h-8 w-8 text-primary" />
                  <p className="font-medium">
                    Seu relatório personalizado está a um clique de distância.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Clique em Gerar relatório para que a IA analise seus dados.
                  </p>
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Fechar</Button>
              </DialogClose>
              <Button
                onClick={handleGenerateReportClick}
                disabled={reportIsLoading}
              >
                {reportIsLoading ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BotIcon className="mr-2 h-4 w-4" />
                )}
                {report ? "Gerar novamente" : "Gerar relatório"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Tela de "Assine o Premium"
          <>
            <DialogHeader>
              <DialogTitle>Funcionalidade Premium</DialogTitle>
              <DialogDescription>
                Você precisa de um plano premium para gerar relatórios
                detalhados com IA.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button asChild>
                <Link href="/subscription">Assinar plano premium</Link>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AiReportButton;
