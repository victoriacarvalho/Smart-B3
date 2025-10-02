"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../_components/ui/sheet";
import { Button } from "../_components/ui/button";
import { Label } from "../_components/ui/label";
import { Input } from "../_components/ui/input";
export default function SaveAndDeleteButtons() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Ativar</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Insira suas informações</SheetTitle>
          <SheetDescription>
            Ao selecionar `Salvar alterações`, você concorda com o envio de
            notifações mensalmente para o número cadastrado.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-name">Nome</Label>
            <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-username">Celular</Label>
            <Input id="sheet-demo-username" defaultValue="+55(DDD)91111-1111" />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Salvar alterações</Button>
          <SheetClose asChild>
            <Button variant="outline">Cancelar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
