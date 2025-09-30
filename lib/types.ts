export enum AssetTypeForAPI {
  ACAO = "ACAO",
  FII = "FII",
  CRIPTO = "CRIPTO",
}

export type AssetPriceData = {
  symbol: string;
  price: number;
  source: string;
};
