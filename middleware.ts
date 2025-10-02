import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define quais rotas não precisam de autenticação
const isPublicRoute = createRouteMatcher([
  "/login(.*)", // A página de login e suas sub-rotas
]);

export default clerkMiddleware((auth, request) => {
  // Se a rota não for pública, protege-a
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Pula os arquivos internos do Next.js e arquivos estáticos
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Executa sempre para rotas de API
    "/(api|trpc)(.*)",
  ],
};
