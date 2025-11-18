"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const MONTH_OPTIONS = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const TimeSelect = () => {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const month = searchParams.get("month");

  const handleMonthChange = (month: string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("month", month);

    push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select
      onValueChange={(value) => handleMonthChange(value)}
      defaultValue={month ?? ""}
    >
      <SelectTrigger className="w-[150px] rounded-full">
        <SelectValue placeholder="Mês" />
      </SelectTrigger>
      <SelectContent>
        {MONTH_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TimeSelect;
