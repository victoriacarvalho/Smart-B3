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
import { BotIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import Link from "next/link";

const AiReportButton = () => {
  const [report, setReport] = useState<string | null>(null);
  const [reportIsLoading, setReportIsLoading] = useState(false);
  const handleGenerateReportClick = async () => {
    try {
      setReportIsLoading(true);
      console.log({ report });
      setReport(report);
    } catch (error) {
      console.error(error);
    } finally {
      setReportIsLoading(false);
    }
  };
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setReport(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          Relatório IA
          <BotIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px]">
        <>
          <DialogHeader>
            <DialogTitle>Relatório IA</DialogTitle>
            <DialogDescription>
              Use inteligência artificial para gerar um relatório com insights
              sobre suas finanças.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="prose prose-h3:text-white prose-h4:text-white prose-strong:text-white max-h-[450px] text-white"></ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={handleGenerateReportClick}
              disabled={reportIsLoading}
            >
              {reportIsLoading && <Loader2Icon className="animate-spin" />}
              Gerar relatório
            </Button>
          </DialogFooter>
        </>
        : (
        <>
          <DialogHeader>
            <DialogTitle>Relatório IA</DialogTitle>
            <DialogDescription>
              Você precisa de um plano premium para gerar relatórios com IA.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button asChild>
              <Link href="/subscription">Assinar plano premium</Link>
            </Button>
          </DialogFooter>
        </>
        ){"}"}
      </DialogContent>
    </Dialog>
  );
};

export default AiReportButton;
