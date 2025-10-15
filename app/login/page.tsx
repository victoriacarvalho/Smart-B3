import Image from "next/image";
import { Button } from "../_components/ui/button";
import { LogInIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const LoginPage = async () => {
  const { userId } = await auth();

  if (userId) {
    return redirect("/");
  }

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-2">
      {/* ESQUERDA (Conteúdo) */}
      <div className="mx-auto flex h-full w-full max-w-[550px] flex-col justify-center p-8">
        <Image
          src="/logo.svg"
          width={173}
          height={39}
          alt="Smart B3 logo"
          className="mb-8"
        />
        <h1 className="mb-3 text-4xl font-bold">Bem vindo!</h1>
        <p className="mb-8 text-muted-foreground">
          Smart B3 é a plataforma definitiva para investidores que buscam
          precisão e tranquilidade no controle fiscal de seus ativos. Diga adeus
          às planilhas complexas e ao estresse da declaração de Imposto de
          Renda.
        </p>
        <SignInButton>
          <Button variant="outline">
            <LogInIcon className="mr-2" />
            Fazer login ou criar conta
          </Button>
        </SignInButton>
      </div>

      {/* DIREITA (Imagem) */}
      <div className="relative hidden h-full w-full md:block">
        <Image
          src="/login.jpg"
          alt="Login illustration"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
};

export default LoginPage;
