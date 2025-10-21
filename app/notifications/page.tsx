// app/notifications/page.tsx
"use client"; // Necessário para usar hooks como useState

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import Navbar from "../_components/navbar";
import { Button } from "../_components/ui/button";
import { Input } from "../_components/ui/input";
import { Label } from "../_components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from "../_components/ui/sheet";
import { useUser } from "@clerk/nextjs";
import { PoliticaDePrivacidade } from "./_components/privacy";
import { updateUserWhatsappInfo } from "../_actions";

const NotificationPage = () => {
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();

  const [name, setName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(
    user?.primaryPhoneNumber?.phoneNumber || "",
  );

  useEffect(() => {
    if (user?.fullName) setName(user.fullName);
    if (user?.primaryPhoneNumber?.phoneNumber)
      setPhone(user.primaryPhoneNumber.phoneNumber);
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await updateUserWhatsappInfo({
          name,
          phoneNumber: phone,
        });
        if (result.success) {
          toast.success(result.message);
        }
      } catch (error) {
        toast.error("Ocorreu um erro. Verifique o console para mais detalhes.");
        console.error(error);
      }
    });
  };

  return (
    <>
      <Navbar />
      <div className="flex h-full flex-col items-center justify-start space-y-8 p-6 pt-12">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="max-w-fit border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Ativar notificações
            </Button>
          </SheetTrigger>
          <SheetContent>
            <form onSubmit={handleSubmit}>
              <SheetHeader>
                <SheetTitle>Insira suas informações</SheetTitle>
                <SheetDescription>
                  Ao salvar, você concorda com nossa política de privacidade e
                  receberá uma mensagem de teste.
                </SheetDescription>
              </SheetHeader>
              <div className="grid flex-1 auto-rows-min gap-6 px-4 py-4">
                <div className="grid gap-3">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    disabled={isPending}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="phone">Celular</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+55 (DDD) 9xxxx-xxxx"
                    disabled={isPending}
                  />
                </div>
              </div>
              <SheetFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Enviando..." : "Salvar "}
                </Button>
                <SheetClose asChild>
                  <Button type="button" variant="outline" disabled={isPending}>
                    Cancelar
                  </Button>
                </SheetClose>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        <div className="w-full max-w-4xl">
          <PoliticaDePrivacidade />
        </div>
      </div>
    </>
  );
};

export default NotificationPage;
