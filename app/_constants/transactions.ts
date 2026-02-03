import {
  AssetType,
  OperationType,
  TransactionType,
  RetentionPeriod,
} from "@prisma/client";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  [AssetType.ACAO]: "Ação",
  [AssetType.FII]: "Fundo de Investimento Imobiliário",
  [AssetType.CRIPTO]: "Criptomoeda",
  [AssetType.UNIFICADA]: "Relatório Unificado",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.COMPRA]: "Compra",
  [TransactionType.VENDA]: "Venda",
  [TransactionType.RENDIMENTO]: "Rendimento",
};

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  [OperationType.SWING_TRADE]: "Swing Trade",
  [OperationType.DAY_TRADE]: "Day Trade",
};

export const TRANSACTION_TYPE_OPTIONS = [
  {
    value: TransactionType.COMPRA,
    label: "Compra",
  },
  {
    value: TransactionType.VENDA,
    label: "Venda",
  },
];

export const ASSET_TYPE_OPTIONS = [
  {
    value: AssetType.ACAO,
    label: ASSET_TYPE_LABELS[AssetType.ACAO],
  },
  {
    value: AssetType.FII,
    label: ASSET_TYPE_LABELS[AssetType.FII],
  },
  {
    value: AssetType.CRIPTO,
    label: ASSET_TYPE_LABELS[AssetType.CRIPTO],
  },
];

export const OPERATION_TYPE_OPTIONS = [
  {
    value: OperationType.SWING_TRADE,
    label: OPERATION_TYPE_LABELS[OperationType.SWING_TRADE],
  },
  {
    value: OperationType.DAY_TRADE,
    label: OPERATION_TYPE_LABELS[OperationType.DAY_TRADE],
  },
];

export const RETENTION_PERIOD_LABELS: Record<RetentionPeriod, string> = {
  [RetentionPeriod.CURTO_PRAZO]: "Curto Prazo (Menos de 1 ano)",
  [RetentionPeriod.LONGO_PRAZO]: "Longo Prazo (1 ano ou mais)",
};

export const RETENTION_PERIOD_OPTIONS = [
  {
    value: RetentionPeriod.CURTO_PRAZO,
    label: RETENTION_PERIOD_LABELS[RetentionPeriod.CURTO_PRAZO],
  },
  {
    value: RetentionPeriod.LONGO_PRAZO,
    label: RETENTION_PERIOD_LABELS[RetentionPeriod.LONGO_PRAZO],
  },
];

export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  [AssetType.ACAO]: "hsl(142.1 76.2% 36.3%)",
  [AssetType.FII]: "hsl(0 84.2% 60.2%)",
  [AssetType.CRIPTO]: "hsl(0 0% 95%)",
  [AssetType.UNIFICADA]: "hsl(240 5% 64.9%)",
};
