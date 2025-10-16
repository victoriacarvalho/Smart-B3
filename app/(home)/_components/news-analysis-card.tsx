"use client"; // Marcamos como client component para interatividade futura (ex: tooltips)

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { NewsAnalysis } from "@/lib/services/newsAnalysisService";
import {
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  BrainCircuit, // Ícone para representar a IA
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NewsAnalysisCardProps {
  analysis: NewsAnalysis[];
}

// Função auxiliar para estilizar o sentimento (cor e ícone)
const getSentimentStyle = (sentiment: NewsAnalysis["sentiment"]) => {
  switch (sentiment) {
    case "Positivo":
      return {
        icon: <TrendingUp className="h-4 w-4 text-green-600" />,
        badgeClass: "bg-green-100 text-green-800 border-green-200",
      };
    case "Negativo":
      return {
        icon: <TrendingDown className="h-4 w-4 text-red-600" />,
        badgeClass: "bg-red-100 text-red-800 border-red-200",
      };
    default:
      return {
        icon: <Minus className="h-4 w-4 text-gray-600" />,
        badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
      };
  }
};

export const NewsAnalysisCard = ({ analysis }: NewsAnalysisCardProps) => {
  // Estado de carregamento ou sem notícias
  if (!analysis || analysis.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
            Análise de Notícias com IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma análise relevante para sua carteira foi encontrada no
            momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Renderização das notícias analisadas
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
          Análise de Notícias com IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysis.slice(0, 3).map((item, index) => {
          // Mostra as 3 análises mais relevantes
          const sentimentStyle = getSentimentStyle(item.sentiment);
          return (
            <div
              key={index}
              className="space-y-3 border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-2"
              >
                <h3 className="text-base font-semibold group-hover:underline">
                  {item.headline}
                </h3>
                <ExternalLink className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </a>

              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <span>{item.source}</span>
                <span>•</span>
                <span>
                  {format(new Date(item.publishedAt), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>

              <p className="text-sm text-foreground/90">{item.summary}</p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Badge className={sentimentStyle.badgeClass}>
                  {sentimentStyle.icon}
                  <span className="ml-1.5">{item.sentiment}</span>
                </Badge>
                {item.impactedAssetSymbols.map((symbol) => (
                  <Badge key={symbol} variant="secondary">
                    {symbol}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Análises geradas por IA. Não é uma recomendação de investimento.
        </p>
      </CardContent>
    </Card>
  );
};
