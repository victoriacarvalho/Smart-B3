"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AssetType } from "@prisma/client";
import { NumericFormat } from "react-number-format";
import { scanReceipt } from "@/app/_actions/scan-receipt"; 
import { Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner"; 

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
import { upsertTransactionSchema as formSchema } from "@/app/_actions/schema";

const BROKERAGE_LOCATION_OPTIONS = [
  { value: "false", label: "Nacional (Brasil)" },
  { value: "true", label: "Estrangeira (Exterior)" },
];

interface ActiveAssetInfo {
  assetId: string;
  symbol: string;
  name: string;
  type: AssetType;
  apiId?: string | null;
}

// --- Props ---
interface UpsertOperationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  assetInfo: ActiveAssetInfo;
  operationId?: string;
  defaultValues?: Partial<z.infer<typeof formSchema>>;
}

const UpsertOperationDialog = ({
  isOpen,
  setIsOpen,
  onSubmit,
  assetInfo,
  operationId,
  defaultValues,
}: UpsertOperationDialogProps) => {
  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      assetId: assetInfo.assetId,
      assetType: assetInfo.type,
      id: operationId,
    },
  });

  const { watch, setValue } = form;
  const quantity = watch("quantity");
  const unitPrice = watch("unitPrice");
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  useEffect(() => {
    if (operationId) return;

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

  const handleFormSubmit = (data: z.input<typeof formSchema>) => {
    onSubmit(data as z.infer<typeof formSchema>);
  };


  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    
 
    toast.info("Lendo comprovante com IA..."); 

    const formData = new FormData();
    formData.append("file", file);

    try {
    
      const result = await scanReceipt(formData);

      if (result.success && result.data) {
        const { date, quantity, unitPrice, fees, type, symbol } = result.data;

        if (symbol && assetInfo.symbol && symbol.toUpperCase() !== assetInfo.symbol.toUpperCase()) {
          const confirm = window.confirm(`O comprovante parece ser de ${symbol}, mas você está em ${assetInfo.symbol}. Deseja preencher mesmo assim?`);
          if (!confirm) {
            setIsScanning(false);
            return;
          }
        }

        if (date) form.setValue("date", new Date(date));
        
        if (quantity) form.setValue("quantity", Number(quantity));
        if (unitPrice) form.setValue("unitPrice", Number(unitPrice));
        if (fees) form.setValue("fees", Number(fees));
        
        if (type) {
           const formattedType = type.toUpperCase();
           if (formattedType === "COMPRA" || formattedType === "VENDA") {
             form.setValue("type", formattedType as never);
           }
        }

        toast.success("Dados preenchidos! Verifique antes de salvar.");
        
      } else {
        toast.error("Não foi possível ler os dados do comprovante. Tente uma imagem mais nítida.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar o arquivo.");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

        {!operationId && (
          <div className="mb-6">
             <input
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleReceiptUpload}
            />
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-auto py-4 flex flex-col gap-2 border-dashed border-2 hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm font-medium">Analisando comprovante...</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-primary">
                    <ScanLine className="h-5 w-5" />
                    <span className="font-semibold">Preenchimento Automático com IA</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-normal">
                    Clique para enviar PDF ou Imagem do comprovante
                  </span>
                </>
              )}
            </Button>
          </div>
        )}
       

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            {" "}
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
            {/* 👇 ADICIONE ESTE BLOCO NOVO 👇 */}
            <FormField
              control={form.control}
              name="fees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxas (R$)</FormLabel>
                  <FormControl>
                    <MoneyInput
                      placeholder="R$ 0,00"
                      value={field.value ?? ""}
                      onValueChange={({ floatValue }) =>
                        field.onChange(floatValue)
                      }
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

              {assetInfo.type === AssetType.CRIPTO && (
                <FormField
                  control={form.control}
                  name="isForeignExchange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local da Corretora</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "true")
                        }
                        value={
                          field.value !== undefined ? String(field.value) : ""
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Nacional ou Estrangeira..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BROKERAGE_LOCATION_OPTIONS.map((option) => (
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
