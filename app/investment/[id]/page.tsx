import Image from "next/image";
import { LogInIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/app/_components/ui/button";

const LoginPage = async () => {
  const { userId } = await auth();

  if (userId) {
    return redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center md:grid md:h-screen md:grid-cols-5 md:items-stretch md:justify-normal">
      <div className="mx-auto flex w-full max-w-[550px] flex-col justify-center p-8 md:col-span-2">
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

      <div className="relative hidden h-full w-full md:col-span-3 md:block">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        >
          <source src="login.mp4" type="video/mp4" />
          Seu navegador não suporta o elemento de vídeo.
        </video>
      </div>
    </div>
  );
};

export default LoginPage;
