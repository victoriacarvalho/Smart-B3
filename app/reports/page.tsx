import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/_lib/prisma";
import Navbar from "../_components/navbar";
import { DataTable } from "@/app/_components/ui/data-table";
import { darfColumns } from "./_components/darf-columns";

export default async function ReportsPage() {
  const { userId } = auth();
  if (!userId) redirect("/login");

  const darfs = await db.darf.findMany({
    where: { userId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return (
    <>
      <Navbar />
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Relatórios gerados</h1>

        <DataTable
          columns={darfColumns}
          data={JSON.parse(JSON.stringify(darfs))}
        />
      </div>
    </>
  );
}
