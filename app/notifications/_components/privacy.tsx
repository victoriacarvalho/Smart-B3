import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/_components/ui/accordion";

export function PoliticaDePrivacidade() {
  const privacyItems = [
    {
      title: "1. Introdução",
      content:
        "Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações ao adquirir e utilizar nosso curso sobre APIs de WhatsApp.",
    },
    {
      title: "2. Coleta de Informações",
      content:
        "Coletamos informações pessoais fornecidas por você ao se inscrever no curso, como nome, e-mail e dados de pagamento.",
    },
    {
      title: "3. Uso das Informações",
      content:
        "Usamos suas informações para fornecer acesso ao curso, processar pagamentos e comunicar atualizações e informações relevantes sobre o curso.",
    },
    {
      title: "4. Compartilhamento de Informações",
      content:
        "Não compartilhamos suas informações pessoais com terceiros, exceto conforme necessário para processar pagamentos ou conforme exigido por lei.",
    },
    {
      title: "5. Segurança das Informações",
      content:
        "Implementamos medidas de segurança adequadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.",
    },
    {
      title: "6. Alterações na Política de Privacidade",
      content:
        "Podemos atualizar esta Política de Privacidade a qualquer momento. Notificaremos sobre quaisquer mudanças através dos meios de comunicação fornecidos.",
    },
    {
      title: "7. Encerramento do Serviço",
      content:
        "Podemos encerrar o fornecimento do curso e seus serviços a qualquer momento, sem prejuízo para nossa parte.",
    },
    {
      title: "8. Vigência e Acesso",
      content:
        "A assinatura do curso garante acesso ao conteúdo durante sua vigência. Após o término da assinatura, o acesso será encerrado.",
    },
    {
      title: "9. Responsabilidade do Usuário",
      content:
        "O usuário é responsável pelo uso do conhecimento adquirido no curso e por qualquer software desenvolvido com base nesse conhecimento. Não nos responsabilizamos por quaisquer problemas decorrentes do uso do conteúdo ensinado.",
    },
    {
      title: "10. Contato",
      content:
        "Para dúvidas ou mais informações sobre esta Política de Privacidade, entre em contato conosco através dos canais fornecidos.",
    },
  ];

  return (
    <>
      <div className="container mx-auto max-w-4xl p-6">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Política de Privacidade
        </h1>
        <Accordion type="single" collapsible className="w-full">
          {privacyItems.map((item, index) => (
            <AccordionItem value={`item-${index + 1}`} key={index}>
              <AccordionTrigger className="text-xl font-semibold">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="text-lg text-muted-foreground">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </>
  );
}
