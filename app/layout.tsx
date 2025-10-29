import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "@/app/_components/ui/sonner";
import { ThemeProvider } from "@/app/_components/theme-provider";

export const metadata: Metadata = {
  title: "Smart B3",
  description: "Plataforma de controle fiscal para investidores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider
            appearance={{
              baseTheme: dark,
            }}
          >
            {children}
            <Toaster richColors />{" "}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
