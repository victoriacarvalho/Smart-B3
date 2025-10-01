"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AssetPageSearch } from "./asset-page-search";
import { AssetSearchIcon } from "./AssetSearchIcon";

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between border-b border-solid px-8 py-4">
      {" "}
      {/* ESQUERDA */}
      <div className="flex items-center gap-10">
        <Image src="logo.svg" width={173} height={39} alt="Logo" />

        <Link
          href="/"
          className={
            pathname === "/"
              ? "font-bold text-primary"
              : "text-muted-foreground"
          }
        >
          Dashboard
        </Link>

        <Link
          href="/transactions"
          className={
            pathname === "/transactions"
              ? "font-bold text-primary"
              : "text-muted-foreground"
          }
        >
          Transações
        </Link>

        <Link
          href="/calculation"
          className={
            pathname === "/calculation"
              ? "font-bold text-primary"
              : "text-muted-foreground"
          }
        >
          Cálculo
        </Link>

        <Link
          href="/reports"
          className={
            pathname === "/reports"
              ? "font-bold text-primary"
              : "text-muted-foreground"
          }
        >
          Relatório
        </Link>
        <Link
          href="/notifications"
          className={
            pathname === "/notifications"
              ? "font-bold text-primary"
              : "text-muted-foreground"
          }
        >
          Alertas
        </Link>
      </div>
      <div>
        <AssetSearchIcon />
        <UserButton showName />
      </div>
    </nav>
  );
};

export default Navbar;
