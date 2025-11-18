"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { Button } from "@/app/_components/ui/button";
import { deleteUserAccount } from "@/app/_actions";

export function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteUserAccount();
        toast.success("Sua conta foi excluída. Você será desconectado.");
        setIsOpen(false);

        // CORREÇÃO AQUI: Redireciona explicitamente para /login após o logout
        await signOut(() => router.push("/login"));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro desconhecido.",
        );
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full max-w-sm hover:bg-red-500/90"
        >
          Excluir Conta Permanentemente
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente sua
            conta e todos os seus dados (carteiras, transações, relatórios) dos
            nossos servidores.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive hover:bg-red-500/90"
          >
            {isPending ? "Excluindo..." : "Sim, excluir minha conta"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
