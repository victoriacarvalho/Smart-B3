"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function scanReceipt(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("Arquivo não encontrado.");

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

  
    const modelName = "gemini-2.5-flash"; 
    const model = genAI.getGenerativeModel({ model: modelName.trim() });

    const prompt = `
      Você é um especialista em ler notas de corretagem e comprovantes financeiros.
      Analise este documento (imagem ou PDF).
      
      Extraia as informações da operação financeira e retorne APENAS um JSON válido, sem blocos de código markdown (\`\`\`json).
      O JSON deve seguir estritamente esta estrutura:
      {
        "date": "YYYY-MM-DD",  // Data do pregão/operação
        "quantity": 0.0,       // Quantidade de ativos (número)
        "unitPrice": 0.0,      // Preço unitário (número)
        "fees": 0.0,           // Total de taxas/corretagem/emolumentos (número)
        "type": "COMPRA",      // ou "VENDA" (string maiúscula)
        "symbol": "AAAA3"      // Código do ativo (ex: PETR4, BTC), sem o 'F' no final se for fracionário
      }

      Se não encontrar algum campo, use null.
      Se houver múltiplos ativos, extraia apenas o primeiro ou o mais relevante.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Limpeza para garantir JSON válido
    let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Tenta encontrar o início e fim do objeto JSON
    const jsonStart = cleanText.indexOf("{");
    const jsonEnd = cleanText.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
    }

    const data = JSON.parse(cleanText);

    return { success: true, data };

  } catch (error) {
    console.error("Erro IA Detalhado:", error);
    let errorMessage = "Falha ao processar o comprovante.";
    
    if (error instanceof Error) {
        if (error.message.includes("400")) {
             errorMessage = "Erro de Formatação: Nome do modelo inválido ou arquivo corrompido.";
        } else if (error.message.includes("404")) {
            errorMessage = "Erro de Modelo: O modelo escolhido não está disponível na sua conta.";
        } else if (error.message.includes("API key")) {
            errorMessage = "Erro de Permissão: Chave de API inválida.";
        }
    }

    return { success: false, message: errorMessage };
  }
}