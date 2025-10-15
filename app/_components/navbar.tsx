"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/transactions", label: "Transações" },
    { href: "/calculation", label: "Cálculo" },
    { href: "/reports", label: "Relatório" },
    { href: "/notifications", label: "Alertas" },
  ];

  return (
    <nav className="relative flex items-center justify-between border-b border-solid px-4 py-4 md:px-8">
      <div className="flex items-center gap-4 md:gap-10">
        <Image src="/logo.svg" width={173} height={39} alt="Logo" />
        <div className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "font-bold text-primary"
                  : "text-muted-foreground transition-colors hover:text-primary"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <UserButton showName />
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute left-0 top-full z-10 flex w-full flex-col border-b border-border bg-background shadow-lg md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                `w-full border-t border-border p-4 text-left transition-colors hover:bg-muted ` + // Classes base para todos
                (pathname === link.href
                  ? "font-bold text-primary"
                  : "text-muted-foreground")
              }
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
