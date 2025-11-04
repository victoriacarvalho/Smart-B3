import {
  TransactionType,
  OperationType,
  RetentionPeriod,
} from "@prisma/client";
import { z } from "zod";

export const upsertTransactionSchema = z.object({
  id: z.string().cuid().optional(),
  assetType: z.enum(["ACAO", "FII", "CRIPTO"]),
  assetId: z.string().cuid({ message: "O ID do ativo é obrigatório." }),
  type: z.nativeEnum(TransactionType, {
    message: "O tipo de transação (compra/venda) é obrigatório.",
  }),
  quantity: z.number().positive("A quantidade deve ser um número positivo."),
  unitPrice: z
    .number()
    .positive("O preço unitário deve ser um número positivo."),
  fees: z
    .number()
    .min(0, "As taxas não podem ser negativas.")
    .optional()
    .default(0),

  date: z.date().refine((val) => val instanceof Date && !isNaN(val.getTime()), {
    message: "A data da operação é obrigatória.",
  }),

  operationType: z.nativeEnum(OperationType).optional(),
  retentionPeriod: z.nativeEnum(RetentionPeriod).optional(),
  isForeignExchange: z.boolean().optional().default(false),
});
