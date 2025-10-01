"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/transactions", label: "Transações" },
    { href: "/calculation", label: "Cálculo" },
    { href: "/reports", label: "Relatório" },
    { href: "/notifications", label: "Alertas" },
  ];

  return (
    <nav className="border-b border-border bg-background px-4 py-4 text-foreground sm:px-6">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        {/* Logo + Toggle */}
        <div className="flex w-full items-center justify-between sm:w-auto">
          <Image src="/logo.svg" width={173} height={39} alt="Logo" />
          <button
            className="text-foreground focus:outline-none sm:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {/* Menu Hamburger */}
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Links */}
        <div
          className={`${
            isOpen ? "block" : "hidden"
          } mt-4 w-full sm:mt-0 sm:flex sm:w-auto sm:items-center sm:space-x-6`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${
                  pathname === link.href
                    ? "font-bold text-primary"
                    : "text-muted-foreground"
                } transition-colors hover:text-primary`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* User */}
        <div className="hidden sm:block">
          <UserButton showName />
        </div>
      </div>

      {/* User button on mobile */}
      <div className="mt-4 block sm:hidden">
        <UserButton showName />
      </div>
    </nav>
  );
};

export default Navbar;
