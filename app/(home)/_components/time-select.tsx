"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { cn } from "@/app/_lib/utils";
import { Button } from "@/app/_components/ui/button";
import { Calendar } from "@/app/_components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";

const TimeSelect = () => {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (startDateParam && endDateParam) {
      return {
        from: new Date(startDateParam),
        to: new Date(endDateParam),
      };
    }
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  });

  const handleSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);

    if (selectedDate?.from && selectedDate?.to) {
      const params = new URLSearchParams(searchParams.toString());

      params.delete("month");
      params.delete("year");

      params.set("startDate", format(selectedDate.from, "yyyy-MM-dd"));
      params.set("endDate", format(selectedDate.to, "yyyy-MM-dd"));

      push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start rounded-full text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd 'de' MMM", { locale: ptBR })} -{" "}
                  {format(date.to, "dd 'de' MMM, yyyy", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "dd 'de' MMM, yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TimeSelect;
