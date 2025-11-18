import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { toast } from "sonner";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Por favor, adicione CLERK_WEBHOOK_SECRET ao .env");
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Erro: Faltando headers svix", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Erro ao verificar webhook:", err);
    toast.error("Erro ao verificar webhook:");
    return new Response("Erro: Webhook inválido", { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === "user.deleted") {
    if (!id) {
      return new Response("Erro: ID do usuário faltando", { status: 400 });
    }

    try {
      await db.user.delete({
        where: { id: id },
      });
    } catch (err) {
      console.error("Erro ao deletar usuário do DB:", err);
      return new Response("Erro interno ao processar exclusão", {
        status: 500,
      });
    }
  }

  return new Response("", { status: 200 });
}
