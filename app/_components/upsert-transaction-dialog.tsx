"use client";

import { useEffect, useState } from "react"; // 1. IMPORTAR HOOKS
import { AssetType, OperationType, TransactionType } from "@prisma/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Button } from "./ui/button";
import { DatePicker } from "./ui/date-picker";
import { MoneyInput } from "./money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  OPERATION_TYPE_OPTIONS,
  RetentionPeriod,
  RETENTION_PERIOD_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
} from "../_constants/transactions";
import { NumericFormat } from "react-number-format";
import { Input } from "./ui/input";

// 2. INTERFACE APRIMORADA para receber o `apiId` opcional
interface ActiveAsset {
  assetId: string;
  symbol: string;
  name: string;
  type: AssetType;
  apiId?: string;
}

interface UpsertTransactionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: FormSchema) => Promise<void>;
  assetInfo: ActiveAsset; // Usando a nova interface
  transactionId?: string;
  defaultValues?: Partial<FormSchema>;
}

// O schema do formulário permanece o mesmo
const formSchema = z
  .object({
    id: z.string().optional(),
    assetId: z.string().cuid(),
    assetType: z.nativeEnum(AssetType), // Campo auxiliar para validação
    type: z.nativeEnum(TransactionType, {
      required_error: "O tipo (Compra/Venda) é obrigatório.",
    }),
    quantity: z.number().positive("A quantidade deve ser maior que zero."),
    unitPrice: z.number().positive("O preço unitário deve ser maior que zero."),
    fees: z.number().min(0).optional().default(0),
    date: z.date({ required_error: "A data é obrigatória." }),
    operationType: z.nativeEnum(OperationType).optional(),
    retentionPeriod: z.nativeEnum(RetentionPeriod).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.assetType === AssetType.ACAO ||
        data.assetType === AssetType.CRIPTO) &&
      !data.operationType
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O tipo de operação é obrigatório.",
        path: ["operationType"],
      });
    }
    if (data.assetType === AssetType.FII && !data.retentionPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O prazo de retenção é obrigatório.",
        path: ["retentionPeriod"],
      });
    }
  });

type FormSchema = z.infer<typeof formSchema>;

const UpsertTransactionDialog = ({
  isOpen,
  setIsOpen,
  onSubmit,
  assetInfo,
  transactionId,
  defaultValues,
}: UpsertTransactionDialogProps) => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      date: defaultValues?.date ?? new Date(),
      assetId: assetInfo.assetId,
      assetType: assetInfo.type,
    },
  });

  // 3. HOOKS para observar campos e gerenciar estado
  const { watch, setValue } = form;
  const quantity = watch("quantity");
  const unitPrice = watch("unitPrice");
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  // 4. LÓGICA CORRIGIDA: Efeito para buscar o preço imediatamente ao abrir o diálogo
  useEffect(() => {
    const identifier =
      assetInfo.type === AssetType.CRIPTO ? assetInfo.apiId : assetInfo.symbol;

    if (identifier) {
      setIsFetchingPrice(true);
      fetch(`/api/assets/price?symbol=${identifier}&type=${assetInfo.type}`)
        .then((res) => {
          if (!res.ok) throw new Error("Preço não encontrado");
          return res.json();
        })
        .then((data) => {
          if (data.price) {
            setValue("unitPrice", data.price, { shouldValidate: true });
          }
        })
        .catch((err) => console.error("Erro ao buscar preço:", err))
        .finally(() => setIsFetchingPrice(false));
    }
  }, [assetInfo, setValue]); // Dispara quando as informações do ativo estiverem prontas

  const handleFormSubmit = async (data: FormSchema) => {
    try {
      await onSubmit({ ...data, id: transactionId });
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Falha ao submeter a transação:", error);
    }
  };

  // 5. Lógica para calcular e exibir o valor total (sem alterações)
  const estimatedTotal =
    quantity > 0 && unitPrice > 0
      ? (quantity * unitPrice).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : null;

  const isUpdate = Boolean(transactionId);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) form.reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Editar" : "Adicionar"} Transação para{" "}
            {assetInfo.symbol.toUpperCase()}
          </DialogTitle>
          <DialogDescription>{assetInfo.name}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (Compra/Venda)..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRANSACTION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <NumericFormat
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={8}
                      placeholder="0,00"
                      value={field.value}
                      onValueChange={({ floatValue }) =>
                        field.onChange(floatValue ?? 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Unitário (R$)</FormLabel>
                  <FormControl>
                    <MoneyInput
                      placeholder="0,00"
                      value={field.value}
                      onValueChange={({ floatValue }) =>
                        field.onChange(floatValue ?? 0)
                      }
                    />
                  </FormControl>
                  {isFetchingPrice && (
                    <p className="animate-pulse text-xs text-muted-foreground">
                      Buscando cotação atual...
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {estimatedTotal && !isFetchingPrice && (
              <div className="rounded-md border bg-muted p-3 text-sm">
                <span className="text-muted-foreground">
                  Valor Total Estimado:{" "}
                </span>
                <span className="font-bold">{estimatedTotal}</span>
              </div>
            )}

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Operação</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(assetInfo.type === AssetType.ACAO ||
              assetInfo.type === AssetType.CRIPTO) && (
              <FormField
                control={form.control}
                name="operationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Operação</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione (Swing/Day Trade)..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OPERATION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {assetInfo.type === AssetType.FII && (
              <FormField
                control={form.control}
                name="retentionPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo de Retenção</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o prazo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RETENTION_PERIOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isFetchingPrice}>
                {isFetchingPrice
                  ? "Aguarde..."
                  : isUpdate
                    ? "Atualizar"
                    : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertTransactionDialog;
