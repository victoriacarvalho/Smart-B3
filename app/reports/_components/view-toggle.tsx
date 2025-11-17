// app/reports/_components/view-toggle.tsx
"use client";

import * as React from "react";
import { Button } from "@/app/_components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/app/_lib/utils";
import { Files, FileText } from "lucide-react";
export function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "mes";

  const setView = (view: "mes" | "geral") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    if (view === "geral") {
      params.delete("month");
      params.delete("year");
    }
    router.push(pathname + "?" + params.toString());
  };

  const toggleView = () => {
    setView(currentView === "mes" ? "geral" : "mes");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleView}
      className="w-[150px] justify-start text-sm"
    >
      <span className="relative mr-2 h-[1.2rem] w-[1.2rem]">
        <FileText
          className={cn(
            "absolute h-full w-full rotate-0 scale-100 transition-all",
            currentView !== "mes" && "-rotate-90 scale-0",
          )}
        />
        <Files
          className={cn(
            "absolute h-full w-full rotate-90 scale-0 transition-all",
            currentView === "geral" && "rotate-0 scale-100",
          )}
        />
      </span>

      {currentView === "mes" ? (
        <span>Unificado</span>
      ) : (
        <span>Por Categoria </span>
      )}
    </Button>
  );
}
