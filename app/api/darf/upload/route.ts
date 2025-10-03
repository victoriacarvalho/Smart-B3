// app/api/darf/upload/route.ts
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const { filename } = await request.json();

  // A Vercel vai gerar uma URL segura para o upload
  const blob = await put(filename, request.body, {
    access: "public",
  });

  return NextResponse.json(blob);
}
