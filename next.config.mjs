// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Adicione este bloco:
  eslint: {
    // Warning: Isso permite que o build seja concluído mesmo com erros de ESLint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
