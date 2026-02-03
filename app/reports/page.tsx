// app/reports/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/_lib/prisma";
import Navbar from "../_components/navbar";
import { DataTable } from "@/app/_components/ui/data-table";
import { darfColumns } from "./_components/darf-columns";
import { AssetType, Prisma } from "@prisma/client";
import { ViewToggle } from "./_components/view-toggle";
import { DarfText } from "./_components/darf-text";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: { month?: string; year?: string; view?: string };
}) {
  const { userId } = auth();
  if (!userId) redirect("/login");

  const view = searchParams?.view || "mes";

  let whereClause: Prisma.DarfWhereInput = { userId };

  if (view === "mes") {
    whereClause = {
      ...whereClause,
      assetType: AssetType.UNIFICADA,
    };
  } else {
    whereClause = {
      ...whereClause,
      assetType: {
        not: AssetType.UNIFICADA,
      },
    };
  }

  const darfs = await db.darf.findMany({
    where: whereClause,
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return (
    <>
      <Navbar />
      <div className="space-y-6 p-6">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">Relatórios Gerados</h1>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
           
            <DarfText />
             <ViewToggle />
          </div>
        </div>

        <DataTable
          columns={darfColumns}
          data={JSON.parse(JSON.stringify(darfs))}
        />
      </div>
    </>
  );
}
