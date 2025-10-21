import { AssetType, OperationType, TransactionType } from "@prisma/client";

export const ASSET_TYPE_LABELS = {
  ACAO: "Ação",
  FII: "Fundo de Investimento Imobiliário",
  CRIPTO: "Criptomoeda",
};

export const TRANSACTION_TYPE_LABELS = {
  COMPRA: "Compra",
  VENDA: "Venda",
};

export const OPERATION_TYPE_LABELS = {
  SWING_TRADE: "Swing Trade",
  DAY_TRADE: "Day Trade",
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

export enum RetentionPeriod {
  CURTO_PRAZO = "CURTO_PRAZO",
  LONGO_PRAZO = "LONGO_PRAZO",
}

export const RETENTION_PERIOD_LABELS = {
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
  ACAO: "hsl(142.1 76.2% 36.3%)",
  FII: "hsl(0 84.2% 60.2%)",
  CRIPTO: "hsl(0 0% 95%)",
};
