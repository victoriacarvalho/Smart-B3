import { AssetType, OperationType } from "@prisma/client";
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
} from "../_constants/transactions";

interface UpsertTransactionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: FormSchema) => Promise<void>;
  assetSymbol: string;
  assetName: string;
  assetType: AssetType;
  transactionId?: string;
  defaultValues?: Partial<FormSchema>;
}

const formSchema = z
  .object({
    id: z.string().optional(),
    cost: z.number().min(0, "O custo não pode ser negativo."),
    saleValue: z.number().min(0, "O valor da venda não pode ser negativo."),
    date: z.date({ required_error: "A data é obrigatória." }),
    type: z.nativeEnum(AssetType),
    symbol: z.string(),
    // Campos condicionais
    operationType: z.nativeEnum(OperationType).optional(),
    retentionPeriod: z.nativeEnum(RetentionPeriod).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.type === AssetType.ACAO || data.type === AssetType.CRIPTO) &&
      !data.operationType
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O tipo de operação é obrigatório.",
        path: ["operationType"],
      });
    }
    if (data.type === AssetType.FII && !data.retentionPeriod) {
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
  assetSymbol,
  assetName,
  assetType,
  transactionId,
  defaultValues,
}: UpsertTransactionDialogProps) => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      cost: defaultValues?.cost ?? 0,
      saleValue: defaultValues?.saleValue ?? 0,
      date: defaultValues?.date ?? new Date(),
      type: assetType,
      symbol: assetSymbol,
    },
  });

  const handleFormSubmit = async (data: FormSchema) => {
    try {
      await onSubmit({ ...data, id: transactionId });
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Falha ao submeter a transação:", error);
    }
  };

  const isUpdate = Boolean(transactionId);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          form.reset();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Adicionar Transação para {assetSymbol.toUpperCase()}
          </DialogTitle>
          <DialogDescription>{assetName}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo da Compra (R$)</FormLabel>
                  <FormControl>
                    <MoneyInput
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
              name="saleValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Venda (R$)</FormLabel>
                  <FormControl>
                    <MoneyInput
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

            {/* Campo condicional para Ação ou Cripto */}
            {(assetType === AssetType.ACAO ||
              assetType === AssetType.CRIPTO) && (
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

            {/* Campo condicional para FII */}
            {assetType === AssetType.FII && (
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
              <Button type="submit">
                {isUpdate ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertTransactionDialog;
