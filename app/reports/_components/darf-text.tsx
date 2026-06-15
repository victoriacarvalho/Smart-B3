// app/reports/_components/view-toggle.tsx
"use client";

import * as React from "react";
import { Button } from "@/app/_components/ui/button";
import { Files } from "lucide-react";
import Link from "next/link";

export function DarfText() {
  

 

  return (
    <Button
            asChild
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Link href="/reports/irpf">
              <Files className="mr-2 h-4 w-4" />
              Ver texto exemplo
            </Link>
          </Button>
  );
}
