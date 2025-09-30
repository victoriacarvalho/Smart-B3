import {
  TransactionType,
  OperationType,
  RetentionPeriod,
} from "@prisma/client";
import { z } from "zod";

export const upsertTransactionSchema = z.object({
  // O ID é opcional, pois só existirá em uma atualização
  id: z.string().cuid().optional(),

  // Chave estrangeira para o ativo ao qual a transação pertence
  assetId: z.string().cuid({ message: "O ID do ativo é obrigatório." }),

  // Tipo da transação: COMPRA ou VENDA
  type: z.nativeEnum(TransactionType, {
    message: "O tipo de transação (compra/venda) é obrigatório.",
  }),

  // Campos numéricos que vêm do formulário como 'number'
  // mas serão convertidos para 'Decimal' no backend.
  quantity: z.number().positive("A quantidade deve ser um número positivo."),
  unitPrice: z
    .number()
    .positive("O preço unitário deve ser um número positivo."),
  fees: z
    .number()
    .min(0, "As taxas não podem ser negativas.")
    .optional()
    .default(0),

  // A data em que a operação ocorreu
  date: z.date().refine((val) => val instanceof Date && !isNaN(val.getTime()), {
    message: "A data da operação é obrigatória.",
  }),

  // Campos opcionais que dependem do tipo de ativo
  operationType: z.nativeEnum(OperationType).optional(),
  retentionPeriod: z.nativeEnum(RetentionPeriod).optional(),
});
