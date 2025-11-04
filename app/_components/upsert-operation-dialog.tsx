"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AssetType } from "@prisma/client";
import { NumericFormat } from "react-number-format";

import { upsertTransactionSchema } from "@/app/_actions/schema"; // Schema importado

import {
  OPERATION_TYPE_OPTIONS,
  RETENTION_PERIOD_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
} from "../_constants/transactions";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
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
import { DatePicker } from "./ui/date-picker";
import { Input } from "./ui/input";
import { MoneyInput } from "./money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// Este BROKERAGE_LOCATION_OPTIONS não será mais usado neste formulário
/*
const BROKERAGE_LOCATION_OPTIONS = [
  { value: "false", label: "Nacional (Brasil)" },
  { value: "true", label: "Estrangeira (Exterior)" },
];
*/

interface ActiveAssetInfo {
  assetId: string;
  symbol: string;
  name: string;
  type: AssetType;
  apiId?: string | null;
}

interface UpsertOperationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: z.infer<typeof upsertTransactionSchema>) => Promise<void>;
  assetInfo: ActiveAssetInfo;
  operationId?: string;
  defaultValues?: Partial<z.infer<typeof upsertTransactionSchema>>;
}

const UpsertOperationDialog = ({
  isOpen,
  setIsOpen,
  onSubmit,
  assetInfo,
  operationId,
  defaultValues,
}: UpsertOperationDialogProps) => {
  const form = useForm<z.input<typeof upsertTransactionSchema>>({
    resolver: zodResolver(upsertTransactionSchema),
    defaultValues: {
      ...defaultValues,
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      assetId: assetInfo.assetId,
      id: operationId,
      fees: defaultValues?.fees ?? 0,
      // assetType não faz parte do schema, então não é incluído aqui
      // operationType e retentionPeriod virão de defaultValues se existirem
    },
  });

  const { watch, setValue } = form;
  const quantity = watch("quantity");
  const unitPrice = watch("unitPrice");
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  useEffect(() => {
    if (operationId) return; // Não buscar preço na edição

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
  }, [assetInfo, setValue, operationId]);

  const estimatedTotal =
    quantity > 0 && unitPrice > 0
      ? (quantity * unitPrice).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : null;

  // Função interna de submit para garantir que 'fees' seja número
  const handleFormSubmit = (
    values: z.input<typeof upsertTransactionSchema>,
  ) => {
    const dataToSubmit = {
      ...values,
      fees: values.fees ?? 0,
    };
    onSubmit(dataToSubmit);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) form.reset();
      }}
    >
      <DialogTrigger asChild />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {operationId ? "Editar" : "Adicionar"} Operação para{" "}
            <span className="text-primary">
              {assetInfo.symbol.toUpperCase()}
            </span>
          </DialogTitle>
          <DialogDescription>
            {assetInfo.name} ({assetInfo.type})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            {/* Tipo e Data */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Compra ou Venda..." />
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
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Data da Operação</FormLabel>
                    <DatePicker date={field.value} setDate={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quantidade e Preço Unitário */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        decimalScale={
                          assetInfo.type === AssetType.CRIPTO ? 8 : 2
                        }
                        placeholder="0,00"
                        value={field.value ?? ""}
                        onValueChange={({ floatValue }) =>
                          field.onChange(floatValue)
                        }
                        allowNegative={false}
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
                        placeholder="R$ 0,00"
                        value={field.value ?? ""}
                        onValueChange={({ floatValue }) =>
                          field.onChange(floatValue)
                        }
                        disabled={isFetchingPrice}
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
            </div>
            {/* Campo Fees */}
            <FormField
              control={form.control}
              name="fees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxas (Opcional)</FormLabel>
                  <FormControl>
                    <MoneyInput
                      placeholder="R$ 0,00"
                      value={field.value ?? ""}
                      onValueChange={({ floatValue }) =>
                        field.onChange(floatValue ?? 0)
                      } // Garante 0 se vazio
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Total */}
            {estimatedTotal && !isFetchingPrice && (
              <div className="rounded-md border bg-muted p-3 text-sm">
                <span className="text-muted-foreground">
                  Valor Total Estimado:{" "}
                </span>
                <span className="font-semibold">{estimatedTotal}</span>
                <span className="text-xs text-muted-foreground">
                  {" "}
                  (sem taxas)
                </span>
              </div>
            )}

            {/* Campos Condicionais */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Swing ou Day Trade..." />
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

              {/* REMOVIDO O FormField para isForeign */}

              {assetInfo.type === AssetType.FII && (
                <FormField
                  control={form.control}
                  name="retentionPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo de Retenção</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Curto ou Longo Prazo..." />
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
            </div>

            {/* Botões */}
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isFetchingPrice || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Salvando..."
                  : isFetchingPrice
                    ? "Aguarde..."
                    : operationId
                      ? "Salvar Alterações"
                      : "Adicionar Operação"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertOperationDialog;
